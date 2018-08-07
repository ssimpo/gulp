'use strict';

const Undertaker = require('undertaker-registry');
const {importTasks} = require('./');
const notifier = require('node-notifier');
const {argv} = require('./argv');


const restictedProps = new Set([
	'src', 'dest', 'symlink', 'task', 'lastRun', 'parallel', 'series', 'watch', 'tree', 'registry'
]);


class Augment_Registry extends Undertaker {
	constructor(options={}) {
		super(options);
		Object.keys(options).forEach(key=>{
			if (!restictedProps.has(key)) this[key] = options[key];
		});
	}

	init(undertaker) {
		importTasks(this, undertaker);
	}
}

module.exports = {
	Augment_Registry
};
