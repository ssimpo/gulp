'use strict';

const path = require('path');
const Undertaker = require('undertaker-registry');
const {importTasks, set, get} = require('./lib');
const asyncDone = require('async-done');
const notifier = require('node-notifier');

const restictedProps = new Set([
	'src', 'dest', 'symlink', 'task', 'lastRun', 'parallel', 'series', 'watch', 'tree', 'registry'
]);


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

	get(name) {
		const task = super.get(name);
		if (!!this.top) return task;
		this.top = true;
		return done=>{
			asyncDone(task, ()=>{
				this.top = false;
				notifier.notify({
					title: 'Gulp Task Complete',
					message: `Gulp task: "${name}" has completed`,
					icon: path.join(__dirname, '/media/images/gulp.png'),
					wait: false
				});
				done();
			});
		};
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