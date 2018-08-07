'use strict';

const {sep} = require('path');
const notifier = require('node-notifier');
const requireLike = require('require-like');


function getGulpCliVersion() {
	const xGulpCli = new RegExp(`/.*gulp\-cli.*\\${sep}versioned\\${sep}.([0-9.]+)`);
	const versioned = Object.keys(require.cache).find(filepath=>xGulpCli.test(filepath));
	if (!versioned) return 3;
	try {
		return parseInt(xGulpCli.exec(versioned)[1].split('.').shift());
	} catch(err) {
		return 3;
	}
}

function getCliGulp(parentId=module.parent.parent.id) {
	const version = getGulpCliVersion();
	const require = requireLike(module.parent.parent.id);
	try {
		if (version === 4) return require('gulp4');
	} catch(err) {
		return require('gulp');
	}

	if (version === 3) return require('gulp');
}

module.exports = {
	getCliGulp, getGulpCliVersion
};
