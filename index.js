'use strict';

const {dirname} = require('path');
const {Notifier_Registry} = require('./lib/Notifier_Registry');
const {importTasks, set, get} = require('./lib');
const {Augment_Registry} = require('./lib/Augment_Registry');
const {getCliGulp, getGulpCliVersion} = require('./lib/detect');
const {argv} = require('./lib/argv');


function augment(options={}) {
	const parent = module.parent.id;

	if (!options.gulp) options.gulp = getCliGulp(parent);
	if (!options.root) options.root = dirname(parent);
	if (argv.verbose) options.debug = true;

	if (options.gulp.registry) {
		options.gulp.registry(new Augment_Registry(options));
		options.gulp.registry(new Notifier_Registry());
	} else {
		const {gulp, root, ...config} = options;
		Object.keys(config).forEach(optionName=>set(optionName, config[optionName]));
		importTasks(root, gulp);
	}

	return options.gulp;
}


module.exports = {
	Augment_Registry,
	set,
	get,
	Notifier_Registry,
	augmentGulp:importTasks,
	getGulpCliVersion,
	getCliGulp,
	augment,
	argv
};