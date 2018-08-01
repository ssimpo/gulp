'use strict';

const lodash = require('lodash').runInContext();
const path = require('path');
const fs = require('fs');
const {xQuoted, xObject,xArray, xPreFunctionParams, xPostFunctionParams, paramDefaultMatchers} = require('./consts');
const getParameters = replaceSequence([[xPreFunctionParams],[xPostFunctionParams]]);


/**
 * Get all the files (full file path) a given directory, filtering-out: . and ..
 *
 * @private
 * @param {string} dirPath		The directory to parse.
 * @returns {Array}				The results.
 */
function filesInDirectory(dirPath) {
	try {
		return lodash.chain(fs.readdirSync(dirPath))
			.filter(file=>((file !== '.') && (file !== '..')))
			.map(file=>path.join(dirPath, file))
			.value();
	} catch(err) {
		return [];
	}
}

/**
 * Test if a value is a number or can be converted to one.
 *
 * @public
 * @param {*} value     Value to test.
 * @returns {boolen}    Is it numeric?
 */
function isNumeric(value) {
	return !lodash.isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Perform a series of replacements on a string in sequence.
 *
 * @public
 * @param {string|*} [txt]      Text to do replacements on.  If it is not a string try to convert to string
 *                              via toString() method.
 * @param {Array} sequence      Replacement sequence as an array in format
 *                              [[<search-for>,<replacement>], [<search-for>,<replacement>]]. If replacement is not
 *                              present then replace with a blank string. If txt is not supplied then return a
 *                              replacer function that will accept text perform the given replacements.
 * @returns {string}            Replacement text.
 */
function replaceSequence(txt, sequence) {
	let _sequence = (sequence?sequence:txt);

	let _replaceSequence = txt=>{
		let _txt = (lodash.isString(txt) ? txt : txt.toString());
		_sequence.forEach(operation=>{
			_txt = _txt.replace(operation[0], operation[1] || '');
		});
		return _txt;
	};

	return (sequence?_replaceSequence(txt):_replaceSequence)
}

/**
 * Parse the source of a function returning an array of parameter names.
 *
 * @public
 * @param {Function|String} func       Function or function source to parse.
 * @returns {Array.<string>}           Array of parameter names.
 */
function parseParameters(func) {
	const defaults = new Map();

	const params = lodash.chain(getParameters(func).split(','))
		.map(param=>param.trim())
		.map(param=>{
			const [paramName, defaultValue] = param.split('=').map(item=>item.trim());
			if (defaultValue) {
				if (xQuoted.test(defaultValue)) {
					const _defaultValue = xQuoted.exec(defaultValue)[2];
					defaults.set(paramName, ()=>()=>_defaultValue);
				} else if (paramDefaultMatchers.has(defaultValue)) {
					const _defaultValue = paramDefaultMatchers.get(defaultValue);
					defaults.set(paramName, ()=>_defaultValue);
				} else if (isNumeric(defaultValue)) {
					if (defaultValue.indexOf('.') !== -1) {
						const _defaultValue = parseFloat(defaultValue);
						defaults.set(paramName, ()=>_defaultValue);
					} else {
						const _defaultValue = parseInt(defaultValue, 10);
						defaults.set(paramName, ()=>_defaultValue);
					}
				} else if (xArray.test(defaultValue) || xObject.test(defaultValue)) {
					defaults.set(paramName, ()=>JSON.parse(defaultValue));
				} else {
					defaults.set(paramName, ()=>defaultValue);
				}
			}
			return paramName;
		})
		.value();

	params.defaults = defaults;
	return params;
}

lodash.mixin(lodash, {filesInDirectory, parseParameters}, {chain:true});
lodash.mixin(lodash, {replaceSequence});

module.exports = lodash;