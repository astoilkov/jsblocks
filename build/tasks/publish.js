module.exports = function (grunt) {
	var Git = require('nodegit');
	var npmUtils = require('npm-utils');
	var GithubGraphQLWrapper = require('../publish/github-graphql.js');
	var fetch = require('node-fetch');
	var gitUser = process.env.GIT_USER;
	var gitKey = process.env.GIT_KEY;
	var gitEmail = process.env.GIT_EMAIL;
	var lastCommit;
	var graphql;


	function getMasterCommit (repo) {
		return repo.getMasterCommit();
	}

	function headIsMaster (repo) {
		return Promise.all([
				repo.getMasterCommit(),
				repo.getHeadCommit()
			]).then(function (commits) {
				var head = commits[1];
				var master = commits[0];
			  return (head.id().toString() == master.id().toString());
			});
	}

	function getPatches(commit) {
		return commit.getDiff().then(function (diffs) {
			return Promise.all(diffs.map(function (diff) {
				return diff.patches();
			})).then(function (patchesArray) {
				var patches = [];
				for (var i in patchesArray) {
					patches.splice.apply(patches, [0, 0].concat(patchesArray[i]));
				}
				return patches;
			});
		});
	}

	function findPackageJsonPatch(patches) {
		var patch;
		for (var i in patches) {
			patch = patches[i];
			if (patch.isModified()) {
				if (patch.newFile().path() == 'package.json') {
					return patch;
				}
			}
		}
		throw new Error('No change in package.json');
	}

	function dontContainsTag (repo, tagName) {
		return Git.Tag.list(repo).then(function (tags) {
			return tags.indexOf(tagName) == -1;
		});
	}

	function hasVersionChange (patch, repo) {
		var oldFile = patch.oldFile();
		var newFile = patch.newFile();
		var newContent;
		var oldContent;
		return Promise.all([
			repo.getBlob(newFile.id()),
			repo.getBlob(oldFile.id())
		]).then(function (blobs) {
			newContent = JSON.parse(blobs[0].toString('utf-8'));
			oldContent = JSON.parse(blobs[1].toString('utf-8'));
			if (newContent.version != oldContent.version) {
				return true;
			}
			return false;
		}).then(function (versionChanged) {
			if (!versionChanged) {
				return false;
			} else {
				return dontContainsTag(repo, newContent.version);
			}
		});
	}

	grunt.registerTask('publish', function() {
		if (!gitUser || !gitKey || !gitEmail) {
			grunt.log.error('Missing login data for github. Make sure GIT_USER, GIT_EMAIL and GIT_KEY are set in the environment.');
			return;
		}
		var done = this.async();

		var repository;
		graphql = new GithubGraphQLWrapper(gitKey, process.env.TRAVIS_REPO_SLUG.split('/')[0], process.env.TRAVIS_REPO_SLUG.split('/')[1]);
		Git.Repository.open('.')
			.then(function (repo) {
				repository = repo;
				return repo;
			})
			.then(headIsMaster)
			.then(function (headIsMaster) {
				if (!headIsMaster) {
					grunt.log.writeln('Not on master branch. Nothing to do.');
					done();
					return;
				}
				return getMasterCommit(repository)
					.then(function (masterCommit) {
						lastCommit = masterCommit.sha();
						return masterCommit;
					})
					.then(getPatches)
					.then(findPackageJsonPatch)
					.then(function (patch) {
						return hasVersionChange(patch, repository);
					})
					.then(function (versionChanged) {
						if (!versionChanged)
							return false;
						return graphql.fetchLastGithubRelease()
								.then(function () {
									return graphql.getLastRelease().tag.name != grunt.config.version;
								});
					})
					.then(function (versionChanged) {
						if (versionChanged) {
							grunt.log.writeln('Package version has changed. Build will be published.');
							return repository.checkoutBranch('master').then(function () {
								grunt.log.writeln('Checkedout master branch');
								grunt.task.run(['build-only', 'publish-post-build']);
								done();
							});

						} else {
							grunt.log.writeln('Version has not changed or is already released.');
							done();
							return;
						}
					});
				})
			.catch(function (e) {
				if (e.message == 'No change in package.json') {
					grunt.log.writeln(e.message);
					done();
				} else {
					grunt.log.warn(e);
					done(false);
				}
			});
	});

	function commitRelease () {
		var version = grunt.config.data.version;
		var repository;
		var index;
		var oid;
		var author = Git.Signature.now(gitUser, gitEmail);
		return Git.Repository.open('.')
			.then(function (repo) {
				repository = repo;
			})
			.then(function () {
				return repository.refreshIndex();
			})
			.then(function (indexRes) {
				index = indexRes;
				return index.addAll();
			})
			.then(function () {
				return index.write();
			}).then(function () {
				return index.writeTree();
			}).then(function (oidRes) {
				oid = oidRes;
				return getMasterCommit(repository);
			}).then(function (parent) {
				return repository.createCommit('HEAD', author, author, '[ci skip] Build Version ' + version, oid, [parent]);
			}).then(function (id) {
				grunt.log.writeln('Created commit ' + id + ' for ' + version);
				return Git.Object.lookup(repository, id, Git.Object.TYPE.COMMIT);
			})
			.then(function (object)  {
				return Git.Tag.create(repository, version, object, author, 'Release v'+version, 0);
			}).then(function () {
				grunt.log.writeln('Created tag ' + version);
				return repository.getRemote('origin');
			})
			.then(function (remote) {
				var tag = 'refs/tags/'+version;
				return remote.push(
					[
					'refs/heads/master:refs/heads/master',
					tag + ':' + tag
					],
					{
						callbacks: {
							credentials: function () {
								return Git.Cred.userpassPlaintextNew(gitKey, 'x-oauth-basic');
							}
						}
					}
				);
			}).then(function () {
				grunt.log.writeln('Pushed to git.');
			});
	}

	function publishRelease () {
		return graphql.fetchCommitsToLastRelease()
			.then(ql => ql.fetchPRsAndIssues())
			.then(function () {
				var commits = graphql.getCommits();
				var prs = graphql.getMergedPRs();
				var issues = graphql.getClosedIssues();
				var commitOids = commits.map(commit => commit.oid);
				var mergedPRs = prs.filter(pr => {
					for (var i in pr.timeline) {
						var mergeEvent = pr.timeline[i];
						if (mergeEvent.commit && commitOids.indexOf(mergeEvent.commit.oid) != -1) {
							return true;
						}
					}
					return false;
				});
				var closedIssues = issues.filter(issue => {
					for (var i in issue.timeline) {
						var event = issue.timeline[i];
						if ( (event.commit && commitOids.indexOf(event.commit.oid) != -1) ||  (event.closeCommit && commitOids.indexOf(event.closeCommit.oid) != -1)) {
							return true;
						}
					}
					return false;
				});
				return {closedIssues: closedIssues, mergedPRs: mergedPRs, commits: commits};
			}).then(history => {
				var releaseNotes = `# ${grunt.config.data.pkg.name} release ${grunt.config.data.version}\n\n`;
				releaseNotes += `## Closed issues:\n`;
				history.closedIssues.forEach(issue => {
					releaseNotes += `* [[\`#${issue.number}\`]](${issue.url}) - ${issue.title}\n`;
				});

				releaseNotes += `\n\n## Merged pull requests:\n`;
				history.mergedPRs.forEach(pr => {
					releaseNotes += `* [[\`#${pr.number}\`]](${pr.url}) - ${pr.title}\n`;
				});

				releaseNotes += `\n\n## Commits:\n`;
				history.commits.forEach(commit => {
					releaseNotes += `* [[\`${commit.oid.substr(0, 10)}\`]](${commit.url}) - ${commit.messageHeadline} \n`;
				});

				return releaseNotes;
			}).then(releaseNotes => {
				return fetch(`https://api.github.com/repos/${graphql.getOwner()}/${graphql.getRepo()}/releases`, {
					method: 'POST',
					headers: {
						Authorization: `token ${gitKey}`,
					},
					body: JSON.stringify({
						prerelease: /rc,alpha,beta/i.test(grunt.config.data.version),
						name: grunt.config.data.version,
						tag_name: grunt.config.data.version,
						body: releaseNotes
					})
				});
			});
	}


	function publishNpm () {
		var cwd = process.cwd();
		process.chdir(require('path').join(cwd, 'dist/npm'));
		grunt.log.writeln('Publishing to NPM.');
		return npmUtils.setAuthToken()
			.then(function () {
				return npmUtils.publish();
			})
			.then(function () {
				process.chdir(cwd);
				grunt.log.writeln('Published to npm.');
			});
	}

	grunt.registerTask('publish-post-build', function () {
       grunt.task.requires('build-only');
       var done = this.async();
       commitRelease()
           .then(publishRelease)
           .then(function () {
                   grunt.log.writeln('Done publishing.');
                   done();
           }).catch(function (e) {
                   grunt.log.error(e);
                   grunt.log.error(e.stack());
                   done(false);
   			});
   });

};
