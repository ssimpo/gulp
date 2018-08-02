'use strict';

const settings = require('./settings');
const {importSettings} = require('./config');
const {isString, kebabCase, chain} = require('./util');
const requireLike = require('require-like');

const resolvers = new Set([
	({param, inject})=>{
		if (inject.hasOwnProperty(param) && !isString(inject[param])) return inject[param];
	},
	({param, require, inject})=>{
		if (inject.hasOwnProperty(param) && isString(inject[param])) return require(inject[param]);
	},
	({param, cwd, inject, require})=>{
		if (param === 'settings') return importSettings(cwd, [...settings.get('settings-paths').values()], require);
		if (param === 'getModule') return moduleId=>_getModule(moduleId, cwd, inject);
		if (param === 'gutil') return require('gulp-util');
	},
	({param, require})=>require(`gulp-${kebabCase(param)}`),
	({param, require})=>require(kebabCase(param)),
	({param, require})=>require(param)
]);

settings.set('resolvers', resolvers);


/**
 * Try to load a module represented by given paramter name.
 *
 * @private
 * @throws {RangeError}							Throws when module not available for given parameter name.
 * @param {string|Array.<string>} param		Parameter name to load module for. If array, load for each and
 * 												return an array.
 * @param {Object} inject						Inject object to use.
 * @returns {*}									Module for given parameter name.
 */
function _getModule({param, cwd=process.cwd(), path=cwd, inject={}}) {
	if (Array.isArray(param)) return param.map(paramName=>getModule(paramName, inject));

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
		.map(param=>_getModule({param, cwd, path, inject}))
		.value();
}

module.exports = {
	getInjection
};