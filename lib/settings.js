'use strict';

module.exports = new Map([
	['taskDir','gulp'],
	['debug',false],
	['settings-paths', new Set([
		'package:gulp',
		'package:name:name',
		'gulp',
		'local'
	])]
]);