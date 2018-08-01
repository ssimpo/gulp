'use strict';

const Undertaker = require('undertaker-registry');
const {importTasks, set, get} = require('./lib');

const restictedProps = new Set(['src', 'dest', 'symlink', 'task', 'lastRun', 'parallel', 'series', 'watch', 'tree', 'registry']);


class _Import_Tasks extends Undertaker {
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

function Import_Tasks(...params) {
	if (new.target)	{
		return new _Import_Tasks(...params);
	} else{
		return importTasks(...params)
	}
}

Import_Tasks.set = set;
Import_Tasks.get = get;

module.exports = Import_Tasks;