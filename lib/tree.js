'use strict';

const path = require('path');
const fs = require('fs');
const settings = require('./settings');
const {chain, isObject, isFunction} = require('./util');
const {xIsJsFile} = require('./consts');
const {log} = require('./log');

function getSetting(key, registry) {
	if (isObject(registry) && (key in registry)) return registry[key];
	return settings.get(key);
}

/**
 * Load a task from the given file path. Returns the file export parsed, with defaults added.
 *
 * @private
 * @param {string} filePath		The path to load.
 * @param {string} cwd			The cwd to assign.
 * @returns {Object}			Task details.
 */
function _loadTask(filePath, cwd) {
	const taskExport = require(filePath);

	if (isFunction(taskExport)) return {fn:taskExport, cwd, path:filePath, deps:[]};
	if (Array.isArray(taskExport)) return {
		deps:taskExport,
		cwd,
		path:filePath,
		fn:done=>{
			if (!!done) return done();
		}
	};
	if (isObject(taskExport)) {
		if (!taskExport.watch) return {deps:[], ...taskExport,cwd, path:filePath};
		return {
			deps:[],
			...taskExport,
			cwd,
			path:filePath,
			fn: gulp=>{
				gulp.watch(taskExport.watch.source, taskExport.watch.tasks);
			}
		};
	}
}

/**
 * Get a task tree for given root directories. Will loop through roots and subdirectories of roots, loading and parsing
 * any found tasks.
 *
 * @private
 * @param {string|string[]} root		The root directories to search.
 * @param {string} [cwd=root]			The cwd to assign.
 * @param {Object} [structure={}]		The task structure tree to expand.
 * @returns {Object}					The task structure tree.
 */
function _tree(root, registry={}, cwd=root, structure={}) {
	const tasksDir = path.join(root, ((root === cwd)?getSetting('taskDir', registry):''));
	if (!!getSetting('debug', registry)) log('Loading tasks from', tasksDir);

	chain(tasksDir)
		.filesInDirectory()
		.forEach(filePath=>{
			const fileName = path.basename(filePath);
			const stats = fs.statSync(filePath);

			if (stats.isDirectory()) {
				structure[fileName] = _tree(filePath, registry, cwd);
			} else if (stats.isFile() && xIsJsFile.test(filePath)) {
				try {
					const taskDetails = _loadTask(filePath, cwd);
					if (!!taskDetails) structure[fileName] = taskDetails;
					if (!taskDetails && !!getSetting('debug', registry)) log('Could not load task', filePath, 'warn');
				} catch(err) {
					console.log(`Could not load task in: ${filePath}`);
					console.error(err);
				}
			} else if (!!getSetting('debug', registry)) {
				log('Could not load task', filePath, 'warn');
			}
		})
		.value();

	return structure;
}

/**
 * Get a tree structure from a directory with given root.  Returns required files if file is .js.
 *
 * @public
 * @param {string|string[]} root		The starting directory/directories.
 * @param {string} [cwd=root]			The working directory
 * @param {Object} [structure={}]		The task structure tree to expand.
 * @returns {Object}					The task structure tree.
 */
function tree(root, registry={}, cwd=root, structure={}) {
	if (!Array.isArray(root)) return _tree(root, registry, cwd, structure);
	root.forEach(root=>_tree(root, registry, root, structure));
	return structure;
}

module.exports = {
	tree
};