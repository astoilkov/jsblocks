module.exports = function (grunt) {
	var Git = require('nodegit');
	var npmUtils = require('npm-utils');
	var Github = require('github');
	var gitUser = process.env.GIT_USER;
	var gitPassword = process.env.GIT_PASSWORD;
	var gitEmail = process.env.GIT_EMAIL;
	var lastCommit;

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
		if (!gitUser || !gitPassword || !gitEmail) {
			grunt.log.error('Missing login data for github. Make sure GIT_USER, GIT_EMAIL and GIT_PASSWORD are set in the environment.');
			return;
		}
		var done = this.async();

		var repository;
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
						if (versionChanged) {
							grunt.log.writeln('Package version has changed. Build will be published.');
							return repository.checkoutBranch('master').then(function () {
								grunt.log.writeln('Checkedout master branch');
								grunt.task.run(['build-only', 'publish-post-build']);
								done();
							});

						} else {
							grunt.log.writeln('Version has not changed.');
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
								return Git.Cred.userpassPlaintextNew(gitUser, gitPassword);
							}
						}
					}
				);
			}).then(function () {
				grunt.log.writeln('Pushed to git.');
			});
	}

	function publishReleaseNotes () {
		var github = new Github();
		if (!process.env.TRAVIS_REPO_SLUG) return;
		var owner = process.env.TRAVIS_REPO_SLUG.split('/')[0];
		var repo = process.env.TRAVIS_REPO_SLUG.split('/')[1];
		github.authenticate({
			type: 'basic',
			username: gitUser,
			password: gitPassword
		});
		var commitParser = new GithubCommitParser(github, owner, repo);
		return github.gitdata.getTags({
			owner: owner,
			repo: repo,
			per_page: 1
		}).then(function (latestTag) {
			var latestReleaseCommit = null;
			if (latestTag[0]) {
				latestReleaseCommit = latestTag[0].object.sha;
			}
			return commitParser.loadCommits(lastCommit, latestReleaseCommit)
				.then(commitParser.loadClosedIssuesForCommits.bind(commitParser))
				.then(commitParser.loadMergedPullRequestsForCommits.bind(commitParser));
		}).then(function () {
			var releaseNotes = '### Release ' + grunt.config.data.version + '\n';
			if (commitParser.closedIssues.length > 0) {
				releaseNotes += '## Issues closed in this release: \n';
				commitParser.closedIssues.forEach(function (issue) {
					releaseNotes += '* [[`#'+ issue.number + '`]](' + issue.html_url + ') - ' + issue.title + '\n';
				});
			}
			if (commitParser.mergedPullRequests.length > 0) {
				releaseNotes += '## Merged pull requests in this release: \n';
				commitParser.mergedPullRequests.forEach(function (pr) {
					releaseNotes += '* [[`#' + pr.number + '`]](' + pr.html_url + ') - ' + pr.title + '\n';
				});
			}
			releaseNotes += '## Commits in this release: \n';
			commitParser.commits.forEach(function (commit) {
				releaseNotes += '* [[`' + commit.sha.substr(0,7) + '`]](' + commit.html_url + ') - ' + commit.split('\n')[0] + '\n';
			});
			return releaseNotes;
		}).then(function (releaseNotes) {
			return github.repos.createRelease({
				owner: owner,
				repo: repo,
				tag_name: grunt.config.data.version,
				name: 'Release ' + grunt.config.data.version,
				body: releaseNotes
			});
		})
		.then(function () {
			grunt.log.writeln('created github release');
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
           .then(publishReleaseNotes)
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

function GithubCommitParser (github, user, repository) {
	this.github = github;
	this.user = user;
	this.repository = repository;
	this.reset();
}
GithubCommitParser.prototype = {
	reset: function () {
		this.commits = [];
		this.closedIssuesEvents = [];
		this.closedIssues = [];
		this.commitPage = 1;
		this.issueEventsPage = 1;
		this.issueEvents = [];
		this.mergedPullRequests = [];
		this.mergedPullRequestEvents = [];
	},
	loadCommits: function (startCommitSha, endCommitSha) {
		var containsCommit = this._containsCommit.bind(this, endCommitSha);
		var self = this;
		return this.github.repos.getCommits({
			owner: this.user,
			repo: this.repository,
			sha: startCommitSha,
			page: self.commitPage++,
			per_page: 100
		}).then(function (commits) {
			self.commits = self.commits.concat(commits);
			return containsCommit();
		}).then(function (res) {
			if (res.contains && self.commits.length % 100 === 0) {
				self.commits.splice(res.index+1);
				return self;
			} else {
				return self.loadCommits(startCommitSha, endCommitSha);
			}
		});
	},
	loadClosedIssuesForCommits: function () {
		var self = this;
		return new Promise(function (resolve) {
			if (self.issueEvents.length === 0) {
				resolve(self._loadIssueEvents());
			} else {
				resolve();
			}
		}).then(function () {
			self._filterClosedIssueEvents();
		}).then(function () {
			self.closedIssues = self.closedIssuesEvents.map(function (event) {
				return event.issue;
			});
			return self;
		});
	},
	loadMergedPullRequestsForCommits: function () {
		var self = this;
		return new Promise(function (resolve) {
			if (self.issueEvents.length === 0) {
				resolve(self._loadIssueEvents());
			} else {
				resolve();
			}
		}).then(function () {
			self._filterPullRequests();
		}).then(function () {
			self.mergedPullRequests = self.mergedPullRequestEvents.filter(function (event) {
				return event.issue;
			});
			return self;
		});
	},
	_loadIssueEvents: function () {
		var self = this;
		return this.github.issues.getEventsForRepo({
			owner: this.user,
			repo: this.repository,
			page: this.issueEventsPage++,
			per_page: 100
		}).then(function (issueEvents) {
			self.issueEvents = self.issueEvents.concat(issueEvents);
			if (issueEvents.length < 100) {
				return;
			} else {
				return self._loadIssueEvents();
			}
		});
	},
	_filterPullRequests: function () {
		var commitShas = this.commits.map(function (commit) {
			return commit.sha;
		});
		this.mergedPullRequestEvents = this.issueEvents.filter(function (event) {
			return commitShas.indexOf(event.commit_id) != -1 && event.event == 'merged';
		});
	},
	_filterClosedIssueEvents: function () {
		var commitShas = this.commits.map(function (commit) {
			return commit.sha;
		});
		this.closedIssuesEvents = this.issueEvents.filter(function (issueEvent) {
			return commitShas.indexOf(issueEvent.commit_id) != -1 && issueEvent.event == 'closed' && !issueEvent.issue.pullRequest;
		});
	},
	_containsCommit: function (commitSha) {
		var commits = this.commits.map(function (commit) {
			return commit.sha;
		});
		if (commits.indexOf(commitSha) == -1) {
			return {contains: false, index: null};
		} else {
			return {contains: true, index: commits.indexOf(commitSha)};
		}
	}
};
