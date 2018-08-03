'use strict';

const colour = require('turbocolor');
const {isDate} = require('./util');
const {argv} = require('yargs');
/**
 * Get a string representation of the current time in the format hhh:mm:ss, suitable for gulp console logging.
 *
 * @private
 * @param {Date} [now=new date()]		The date to get time from.  Defaults to current system time.
 * @returns {string}					The time represented a time string in thhe format:  hh:mm:ss.
 */
function _getTimeNowString(now=new Date()) {
	const [hours, minutes, seconds] = [now.getHours(), now.getMinutes(), now.getSeconds()];
	return `${(hours>9)?hours:`0${hours}`}:${(minutes>9)?minutes:`0${minutes}`}:${(seconds>9)?seconds:`0${seconds}`}`
}

/**
 * Log a message to the console using turbocolor in the style of a gulp console message.
 *
 * @public
 * @param {string} name									The name or id to print.
 * @param {string} [details='']							The details to use (defaults to nothing).
 * @param {string} [level='log']						The log level to use (can be: 'log', 'warn', 'error',
 * 														'info', ...etc, whatever is available as a method of
 * 														console global.
 * @param {string|Date} [now=_getTimeNowString()]		The time to report, defaults to now.
 * @returns {string}									The printed message.
 */
function log(name, details='', level='log', now=_getTimeNowString()) {
	if (!!argv.silent) return '';
	const _now = ((isDate(now)) ? _getTimeNowString(now) : now);
	if (!argv.hasOwnProperty('color') || !!argv.color) {
		const time = `${colour.white('[')}${colour.gray(_now)}${colour.white(']')}`;
		const message = `${time} ${colour.white(name)} ${colour.magenta(details)}`.trim();
		console[level](message);
		return message;
	} else {
		const message = `[${_now}] ${name} ${details}`.trim();
		console[level](message);
		return message;
	}
}

module.exports = {
	log
};