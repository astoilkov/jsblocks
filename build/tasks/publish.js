module.exports = function (grunt) {
	var Git = require('nodegit');
	var npmUtils = require('npm-utils');
	var gitUser = process.env.GIT_USER;
	var gitPassword = process.env.GIT_PASSWORD;
	var gitEmail = process.env.GIT_EMAIL;

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
					.then(getPatches)
					.then(findPackageJsonPatch)
					.then(function (patch) {
						return hasVersionChange(patch, repository);
					})
					.then(function (versionChanged) {
						if (versionChanged) {
							grunt.log.writeln('Package version has changed. Build will be published.');
							grunt.task.run(['build-only', 'publish-post-build']);
							done();
						} else {
							grunt.log.writeln('Version has not changed.');
							done();
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
	grunt.registerTask('publish-post-build', function () {
		grunt.task.requires('build-only');
		var done = this.async();
		var version = grunt.config.data.version;
		var repository;
		var index;
		var oid;
		var author = Git.Signature.create(gitUser, gitEmail, Date.now(), 0);
		Git.Repository.open('.')
			.then(function (repo) {
				repository = repo;
				return repo.refreshIndex();
			})
			.then(function (indexRes) {
				index = indexRes;
				return index.addAll();
			}).then(function () {
				return index.write();
			}).then(function () {
				return index.writeTree();
			}).then(function (oidRes) {
				oid = oidRes;
				return getMasterCommit(repository);
			}).then(function (parent) {
				return repository.createCommit('HEAD', author, author, 'Build Version ' + version, oid, [parent]);
			}).then(function (id) {
				return repository.createTag(id, version, 'Release v'+version);
			}).then(function () {
				return repository.getRemote('origin');
			})
			.then(function (remote) {
				return remote.push(
					["refs/heads/master:refs/heads/master"],
					{
						callbacks: {
							credentials: function () {
								return Git.Cred.userpassPlaintextNew(gitUser, gitPassword);
							}
						}
					}
				);
			})
			.then(function () {
				done();
			}).catch(function (e) {
				grunt.log.error(e);
				done(false);
			});
	});
};
