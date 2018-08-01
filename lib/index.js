'use strict';

const asyncDone = require('async-done');
const settings = require('./settings');
const {createTasks} = require('./tasks');
const {log} = require('./log');
const {getInjection} = require('./di');

/**
 * Create a gulp task for the given id.
 *
 * @param {string} taskId		Task id to lookup in tasks and assign.
 * @returns {Function}			The gulp function.
 */
function _createTask(taskId, tasks, gulp) {
	const task = tasks[taskId];
	const taskFn = function(done) {
		log('Found task', task.path);

		const cwd = task.cwd || process.cwd();
		const _task = function(__done) {
			let isComplete = false;
			const complete = ()=>{
				if (!isComplete) {
					isComplete = true;
					if (!!__done) __done();
					done();
				}
			};

			const di = getInjection({func:task.fn, cwd, path:(task.path || cwd), inject:{gulp, done:complete}});
			if (!!di.find(di=>(di===complete))) return task.fn(...di);
			asyncDone(()=>task.fn(...di), complete);
		};
		_task.displayName = (task.name || task.fn.displayName || taskId);

		if (!task.deps.length) return _task();
		if (!!gulp.series && !!gulp.parallel) {
			return gulp.series([...task.deps.map(taskId=>{
				if (Array.isArray(taskId)) return gulp.parallel(...taskId);
				return taskId;
			}), _task])();
		} else {
			const gulpSequence = require('gulp-sequence').use(gulp);
			return gulpSequence(...task.deps, _task);
		}
	};

	taskFn.displayName = task.name || task.fn.displayName || taskId;

	return taskFn;
}

function _addTasksToGulp(tasks, gulp) {
	const taskIds = new Set([...Object.keys(tasks)]);
	let count = taskIds.size;

	function addTasks() {
		count = taskIds.size;
		taskIds.forEach(taskId=>{
			try {
				if (!!settings.get('debug')) log('Adding task', taskId);
				gulp.task(taskId, _createTask(taskId, tasks, gulp));
				taskIds.delete(taskId);
			} catch(err) {}
		});
	}

	addTasks();
	while((count > 0) && (count !== taskIds.size)) addTasks();
}

function importTasks(root, gulp=require('gulp')) {
	return _addTasksToGulp(createTasks(root, gulp), gulp);
}

module.exports = {
	importTasks,
	get: key=>settings.get(key),
	set: (key, value)=>settings.set(key, value)
};