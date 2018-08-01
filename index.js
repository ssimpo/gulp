'use strict';

const asyncDone = require('async-done');
const settings = require('./lib/settings');
const {createTasks} = require('./lib/tasks');
const {log} = require('./lib/log');
const {isString, kebabCase, chain} = require('./lib/util');
const requireLike = require('require-like');

const resolvers = new Set([
	({param, inject})=>{
		if (inject.hasOwnProperty(param) && !isString(inject[param])) return inject[param];
	},
	({param, require, inject})=>{
		if (inject.hasOwnProperty(param) && isString(inject[param])) return require(inject[param]);
	},
	({param, require})=>require(`gulp-${kebabCase(param)}`),
	({param, require})=>require(kebabCase(param)),
	({param, require})=>require(param)
]);

settings.set('resolvers', resolvers);


/**
 * Try to load a module represented by given paramter name.
 *
 * @throws {RangeError}							Throws when module not available for given parameter name.
 * @param {string|Array.<string>} param		Parameter name to load module for. If array, load for each and
 * 												return an array.
 * @param {Object} inject						Inject object to use.
 * @returns {*}									Module for given parameter name.
 */
function getModule({param, cwd=process.cwd(), path=cwd, inject={}}) {
	if (Array.isArray(param)) return param.map(paramName=>getModule(paramName, inject));
	if (param === 'getModule') return moduleId=>getModule(moduleId, cwd, inject);

	const require = requireLike(path);
	let resolved;
	const found = [...resolvers.values()].find(resolver=>{
		try {
			resolved = resolver({param, cwd, require, inject});
			return !!resolved;
		} catch(err) {}
	});
	if (!!found) return resolved;

	throw new RangeError(`Could not inject module for ${param}, did you forget to 'npm install' / 'yarn add' the given module.`);
}

function getInjection({func, cwd=process.cwd(), inject={}, path=cwd}) {
	return chain(func)
		.parseParameters()
		.filter(param=>param)
		.map(param=>getModule({param, cwd, path, inject}))
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