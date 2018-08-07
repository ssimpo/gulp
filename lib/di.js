'use strict';

const settings = require('./settings');
const {importSettings} = require('./config');
const {isString, kebabCase, chain, memoize, get} = require('./util');
const requireLike = require('require-like');

const resolvers = new Set([
	({param, inject})=>{
		if (inject.hasOwnProperty(param) && !isString(inject[param])) return inject[param];
	},
	({param, require, inject})=>{
		if (inject.hasOwnProperty(param) && isString(inject[param])) return require(inject[param]);
	},
	({param, cwd, inject, require, settings})=>{
		if (param === 'settings') return settings;
		if (param === 'getModule') return moduleId=>_getModule(moduleId, cwd, inject);
		if (param === 'gutil') return require('gulp-util');
	},
	({param, require})=>require(`gulp-${kebabCase(param)}`),
	({param, require})=>require(kebabCase(param)),
	({param, require})=>require(param)
]);

settings.set('resolvers', resolvers);


const _getSettings = memoize(function _getSettings(memId, {cwd, paths, require}) {
	return importSettings(cwd, paths, require);
});

function getSettings(cwd, path, require) {
	const paths = [...settings.get('settings-paths').values()];
	const memId = `${cwd},${path},${paths.join(',')}`;
	return _getSettings(memId, {cwd, paths, require});
}


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
	const settings = getSettings(cwd, path, require);

	let resolved;
	const found = [...resolvers.values()].find(resolver=>{
		try {
			resolved = resolver({
				param,
				cwd,
				require,
				inject:{...get(settings, 'augment.inject', {}), ...inject},
				settings
			});
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