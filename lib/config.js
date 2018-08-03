'use strict';

const path = require('path');
const {get, substituteInObj} = require('./util');
const {argv} = require('yargs');

function getJsonRequire(dirname, filename='package', localRequire=require) {
	try {
		return localRequire(path.join(dirname, `${filename}.json`))
	} catch(err) {
		return {};
	}
}

function importSettings(cwd, paths=[], localRequire=require) {
	return substituteInObj(Object.assign({}, argv, ...paths.map(settingsPath=>{
		const [filename, objectPath='', propName] = settingsPath.split(':');
		const value = ((objectPath !== '') ?
			get(getJsonRequire(cwd, filename, localRequire), objectPath, {}) :
			getJsonRequire(cwd, filename, localRequire)
		);
		if (propName) return {[propName]:value};
		return value;
	})));
}


module.exports = {
	importSettings
};