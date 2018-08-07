'use strict';

const {argv} = require('yargs');
const {chain, extractJson} = require('./util');
const {xBase64} = require('./consts');


chain(argv)
	.keys()
	.filter(key=>xBase64.test(key))
	.forEach(key=>{
		// Sometimes we get some extra chars at the end of the base64 string.
		// This might be a yargs thing. So, extract JSON then parse.
		Object.assign(argv, extractJson(Buffer.from(argv[key], 'base64').toString('utf-8')));
		delete argv[key];
	})
	.value();


module.exports = {
	argv
};