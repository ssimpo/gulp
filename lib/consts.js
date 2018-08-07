'use strict';

module.exports = {
	xIsJsFile: /\.(?:js|json)$/i,
	xQuoted: /^(["'])(.*)\1$/,
	xObject: /^\{.*\}$/,
	xArray: /^\[.*\]$/,
	xPreFunctionParams: /\)[\s\S]*/,
	xPostFunctionParams: /^.*?\(/,
	paramDefaultMatchers: new Map([['null',null],['undefined',undefined],['true',true],['false',false]]),
	xBase64: /.*Base64$/,
	jsonObjectSymbols: ['{', '}'],
	jsonArraySymbols:  ['[', ']']
};