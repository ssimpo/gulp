'use strict';

const settings = require('./settings');
const {chain, forOwn, makeArray, uniq} = require('./util');
const {xIsJsFile} = require('./consts');
const {tree} = require('./tree');
const {argv} = require('./argv');


/**
 * Expand globs in given dependencies array, replacing them in-place in the array. Use given tasks object to find
 * the expansions.
 *
 * @private
 * @param {Object} tasks		The tasks object to search in.
 * @param {Array} deps			The deps to expand.
 * @param {number} depId		The dep number we are working on.
 * @returns {number}			The end of replaced deps to dep array.
 */
function _replaceGlobDeps(tasks, deps, depId) {
	const finder = new RegExp(deps[depId].replace('*', '.*?'));
	const found = chain(tasks)
		.keys()
		.filter(id=>(finder.test(id)))
		.value();

	if (!found.length) return depId;
	deps.splice.apply(deps, [depId, 1].concat(found));
	return (depId-1);
}

/**
 * Expand all globs in the dependencies using given tasks.
 *
 * @private
 * @param {Object} tasks		The tasks to expand globs in.
 * @returns {Object} 			The tasks.
 */
function _parseDeps(tasks) {
	forOwn(tasks, task=>{
		for (let depNo=0; depNo < task.deps.length; depNo++) {
			if (task.deps[depNo].indexOf('*') !== -1) depNo = _replaceGlobDeps(tasks, task.deps, depNo);
		}
	});

	return tasks;
}

/**
 * Given a tree structure, create an object of tasks-ids against task objects.
 *
 * @private
 * @param {Object} tree				The directory tree from tree().
 * @param {string} [parent=""]		The current parent id.
 * @param {Object} [tasks={}]		The task object.
 * @returns {Object}				The flat object, tasks.
 */
function _createTasks(tree, parent='', tasks={}) {
	forOwn(tree, (item, id)=>{
		if (!item.deps && !item.fn) return _createTasks(item, `${_parentId(parent, id)}:`, tasks);
		tasks[_parentId(parent, id)] = item;
	});

	return _parseDeps(tasks);
}

/**
 * Add an id to a parent to get a new full id.
 *
 * @private
 * @param {string} parent		The parent id.
 * @param {string} id			The id.
 * @returns {string}			The full id.
 */
function _parentId(parent, id) {
	return `${parent}${id.replace(xIsJsFile, '')}`;
}

/**
 * Get the a tasks object from the given directory path.
 *
 * @param {string} root		The path to scan.
 * @returns {Object}		The tasks object created by _createTasks().
 */
function createTasks(root, registry={}) {
	const roots = uniq([
		...makeArray(root),
		...makeArray(argv.root)
	]);

	return _createTasks(tree(roots, registry));
}

module.exports = {
	createTasks
};