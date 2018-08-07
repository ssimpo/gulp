'use strict';

const {join} = require('path');
const {get, substituteInObj} = require('./util');
const {argv} = require('./argv');


function getJsonRequire(dirname, filename='package', localRequire=require) {
	try {
		return localRequire(join(dirname, `${filename}.json`))
	} catch(err) {
		return {};
	}
}

function importSettings(cwd, paths=[], localRequire=require) {
	return substituteInObj(Object.assign({}, argv, ...paths.map(settingsPath=>{
		const [filename, objectPath='', propName] = settingsPath.split(':');
		const imported = getJsonRequire(cwd, filename, localRequire);
		const value = ((objectPath !== '') ? get(imported, objectPath, {}) : imported);

		if (propName) return {[propName]:value};
		return value;
	}), {cwd}));
}


module.exports = {
	importSettings
};