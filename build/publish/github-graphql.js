var fetch = require('node-fetch');
var fs = require('fs');
var path = require('path');

var files = {};

function readFileForMethod(method) {
	return new Promise(function (resolve, reject) {
		if (files[method]) {
			return setTimeout(resolve.bind(null, files[method]));
		}
		fs.readFile(path.resolve(__dirname, method + '.graphql'), function (err, file) {
			if (err) {
				return reject(err);
			}
			files[method] = file.toString().replace('\n', '');
			resolve(files[method]);
		});
	});
}

function queryGraphQL (method, vars, key) {
	return readFileForMethod(method).then(function (query) {
		var body = JSON.stringify({query: query, variables: vars});
		return fetch('https://api.github.com/graphql', {
			method: 'POST',
			headers: {
				Authorization: 'bearer ' + key
			},
			body: body
		}).then(res => res.json()).then(function (result) {
			if (result.errors && result.errors.length > 0) {
				result.errors.forEach(console.error);
				throw new Error(result.error[0]);
			}
			return result;
		});
	});
}

function hasProperties(obj) {
	for (var key in obj) {
		return true;
	}
	return false;
}

function GithubGraphQLWrapper (key, owner, repo) {
	this._key = key;
	this._repo = repo;
	this._owner = owner;
	this._commits = [];
	this._issues = [];
	this._mergedPRs = [];
	this._closedIssues = [];
	this._lastRelease = null;
	this._commitAfterRef = null;
	this._reachedLastIssue = false;
	this._reachedLastPr = false;
	this._afterPRRef = null;
	this._afterIssueRef = null;
}

GithubGraphQLWrapper.prototype = {
	constructor: GithubGraphQLWrapper,
	fetchLastGithubRelease: function fetchLastGithubRelease () {
		return queryGraphQL('GetMasterCommits', {
			repo: this._repo,
			owner: this._owner,
			includeLastRelease: true,
			after: this._commitAfterRef
		}, this._key).then(result => {
			var data = result.data.repository;
			var parentRelease = data.parent && data.parent.releases.nodes.length && data.parent.releases.nodes[0];
			var lastRelease = data.releases.nodes.length > 0 ? data.releases.nodes[0] : parentRelease;
			var history = data.ref.target.history;
			this._lastRelease = lastRelease;
			this._commits = this._commits.concat(history.nodes);
			this._commitAfterRef = history.pageInfo.endCursor;
			return this;
		});
	},
	fetchCommitsToLastRelease: function () {
		return queryGraphQL('GetMasterCommits', {
			repo: this._repo,
			owner: this._owner,
			includeLastRelease: false,
			after: this._commitAfterRef
		}, this._key).then(result => {
			var data = result.data.repository;
			var history = data.ref.target.history;
			this._commitAfterRef = data.ref.target.history.pageInfo.endCursor;
			this._commits = this._commits.concat(data.ref.target.history.nodes);
			var commitOids = this._commits.map(c => c.oid);
			if (commitOids.indexOf(this._lastRelease.tag.target.oid) == -1 && history.pageInfo.hasNextPage) {
				return this.fetchCommitsToLastRelease();
			}
			this._commits.splice(commitOids.indexOf(this._lastRelease.tag.target.oid));
			return this;
		});
	},
	fetchPRsAndIssues: function () {
		return queryGraphQL('GetClosedIssuesAndMergedPRs', {
			repo: this._repo,
			owner: this._owner,
			includePRs: !this._reachedLastPr,
			includeIssues: !this._reachedLastIssue,
			afterIssues: this._afterIssueRef,
			afterPRs: this._afterPRRef,
		}, this._key).then(result => {
			var repository = result.data.repository;
			var parent = repository.parent;
			var parentIssues = parent && parent.issues && parent.issues.nodes.length && parent.issues;
			var localIssues = repository.issues && repository.issues.nodes.length && repository.issues;
			var issues = localIssues || parentIssues;
			var parentPRs = parent && parent.pullRequests && parent.pullRequests.nodes.length && parent.pullRequests;
			var localPRs = repository.pullRequests && repository.pullRequests.nodes.length && repository.pullRequests;
			var prs = localPRs || parentPRs;
			if (issues) {
				this._reachedLastIssue = !issues.pageInfo.hasNextPage;
				this._afterIssueRef = issues.pageInfo.endCursor;
				this._closedIssues = this._closedIssues.concat(issues.nodes);
			}

			if (prs) {
				this._reachedLastPr = !prs.pageInfo.hasNextPage;
				this._afterPRRef = prs.pageInfo.endCursor;
				this._mergedPRs = this._mergedPRs.concat(prs.nodes);
			}
			if (!this._reachedLastPr && !this._reachedLastIssue) {
				return this.fetchPRsAndIssues();
			}
		}).then(() => {
			this._closedIssues = this._closedIssues.map(issue => {
				issue.timeline = issue.timeline.nodes.filter(hasProperties);
				return issue;
			}).filter(issue => issue.timeline.length > 0);
			this._mergedPRs.map(pr => {
				pr.timeline = pr.timeline.nodes.filter(hasProperties);
				return pr;
			}).filter(pr => pr.timeline.length > 0);
			return this;
		});
	},
	getLastRelease: function () {
		return this._lastRelease;
	},
	getMergedPRs: function () {
		return this._mergedPRs;
	},
	getCommits: function () {
		return this._commits;
	},
	getClosedIssues: function () {
		return this._closedIssues;
	},
	getOwner: function () {
		return this._owner;
	},
	getRepo: function () {
		return this._repo;
	}
};

module.exports = GithubGraphQLWrapper;