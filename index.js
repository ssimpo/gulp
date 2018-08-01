'use strict';

const asyncDone = require('async-done');
const settings = require('./lib/settings');
const {createTasks} = require('./lib/tasks');
const {log} = require('./lib/log');
const {isString, kebabCase, chain} = require('./lib/util');

const resolvers = [
	(paramName, cwd, inject)=>{
		if (inject.hasOwnProperty(paramName) && !isString(inject[paramName])) return inject[paramName];
	},
	(paramName, cwd, inject)=>require(((inject.hasOwnProperty(paramName) && isString(inject[paramName])) ?
			inject[paramName] :
			`gulp-${kebabCase(paramName)}`
	)),
	paramName=>{
		if (xRollupPluginTest.test(paramName)) {
			return require(kebabCase(paramName).replace('rollup-','rollup-plugin-'));
		}
	},
	paramName=>require(kebabCase(paramName)),
	paramName=>require(paramName)
];


/**
 * Try to load a module represented by given paramter name.
 *
 * @throws {RangeError}							Throws when module not available for given parameter name.
 * @param {string|Array.<string>} paramName		Parameter name to load module for. If array, load for each and
 * 												return an array.
 * @param {Object} inject						Inject object to use.
 * @returns {*}									Module for given parameter name.
 */
function getModule(paramName, cwd=process.cwd(), inject={}) {
	if (Array.isArray(paramName)) return paramName.map(paramName=>getModule(paramName, inject));
	if (paramName === 'getModule') return moduleId=>getModule(moduleId, cwd, inject);

	let resolved;
	const found = resolvers.find((resolver, n)=>{
		try {
			resolved = resolver(paramName, cwd, inject);
			return !!resolved;
		} catch(err) {}
	});
	if (!!found) return resolved;

	throw new RangeError(`Could not inject module for ${paramName}, did you forget to 'npm install' / 'yarn add' the given module.`);
}

function getInjection(func, cwd=process.cwd(), inject={}) {
	return chain(func)
		.parseParameters()
		.filter(param=>param)
		.map(param=>getModule(param, cwd, inject))
		.value();
}

/**
 * Create a gulp task for the given id.
 *
 * @param {string} taskId		Task id to lookup in tasks and assign.
 * @returns {Function}			The gulp function.
 */
function createTask(taskId, tasks, gulp) {
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

			const di = getInjection(task.fn, cwd, {gulp, done:complete});
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

function addTasksToGulp(tasks, gulp) {
	const taskIds = new Set([...Object.keys(tasks)]);
	let count = taskIds.size;

	function addTasks() {
		count = taskIds.size;
		taskIds.forEach(taskId=>{
			try {
				if (!!settings.get('debug')) log('Adding task', taskId);
				gulp.task(taskId, createTask(taskId, tasks, gulp));
				taskIds.delete(taskId);
			} catch(err) {}
		});
	}

	addTasks();
	while((count > 0) && (count !== taskIds.size)) addTasks();
}

module.exports = {
	createTasks,
	addTasksToGulp,
	get: key=>settings.get(key),
	set: (key, value)=>settings.set(key, value)
};