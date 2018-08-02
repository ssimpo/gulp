'use strict';

const path = require('path');
const {get, substituteInObj} = require('./util');


function getJsonRequire(dirname, filename='package', localRequire=require) {
	try {
		return localRequire(path.join(dirname, `${filename}.json`))
	} catch(err) {
		return {};
	}
}

function importSettings(cwd, paths=[], localRequire=require) {
	return substituteInObj(Object.assign(...paths.map(settingsPath=>{
		const [filename, objectPath='', propName] = settingsPath.split(':');
		const value = get(getJsonRequire(cwd, filename, localRequire), objectPath);
		if (propName) return {[propName]:value};
		return value;
	})));
}


module.exports = {
	importSettings
};