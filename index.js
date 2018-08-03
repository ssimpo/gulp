'use strict';

const path = require('path');
const Undertaker = require('undertaker-registry');
const {importTasks, set, get} = require('./lib');
const asyncDone = require('async-done');
const notifier = require('node-notifier');
const requireLike = require('require-like');
const {argv} = require('yargs');

const restictedProps = new Set([
	'src', 'dest', 'symlink', 'task', 'lastRun', 'parallel', 'series', 'watch', 'tree', 'registry'
]);


class Augment_Registry extends Undertaker {
	constructor(options={}) {
		super(options);
		Object.keys(options).forEach(key=>{
			if (!restictedProps.has(key)) this[key] = options[key];
		});
	}

	init(undertaker) {
		importTasks(this, undertaker);
	}
}

class Notifier_Registry extends  Undertaker {
	get(name) {
		const task = super.get(name);
		if (!!this.top) return task;
		this.top = true;
		return done=>{
			asyncDone(task, ()=>{
				this.top = false;
				notifier.notify({
					title: 'Gulp Task Complete',
					message: `Gulp task: "${name}" has completed`,
					icon: path.join(__dirname, '/media/images/gulp.png'),
					wait: false
				});
				done();
			});
		};
	}
}

function getGulpCliVersion() {
	const {sep} = require('path');
	const xGulpCli = new RegExp(`/.*gulp\-cli.*\\${sep}versioned\\${sep}.([0-9.]+)`);
	const versioned = Object.keys(require.cache).find(filepath=>xGulpCli.test(filepath));
	if (!versioned) return 3;
	try {
		return parseInt(xGulpCli.exec(versioned)[1].split('.').shift());
	} catch(err) {
		return 3;
	}
}

function getCliGulp() {
	const version = getGulpCliVersion();
	const require = requireLike(module.parent.id);
	if (version === 4) return require('gulp4');
	if (version === 3) return require('gulp');
}

function augment(options={}) {
	if (!options.gulp) options.gulp = getCliGulp();
	if (!options.root) options.root = path.dirname(module.parent.id)
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
	Augment_Registry, set, get, Notifier_Registry, augmentGulp:importTasks, getGulpCliVersion, getCliGulp, augment
};