'use strict';

const {argv} = require('yargs');
const {chain} = require('./util');

const xBase64 = /.*Base64$/;


chain(argv)
	.keys()
	.filter(key=>xBase64.test(key))
	.forEach(key=>{
		Object.assign(argv, JSON.parse(Buffer.from(argv[key], 'base64').toString('utf-8')));
		delete argv[key];
	})
	.value();


module.exports = {
	argv
};