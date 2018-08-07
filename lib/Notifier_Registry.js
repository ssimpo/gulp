'use strict';

const path = require('path');
const Undertaker = require('undertaker-registry');
const {get} = require('./');
const asyncDone = require('async-done');
const notifier = require('node-notifier');



class Notifier_Registry extends  Undertaker {
	get(name) {
		const task = super.get(name);
		if (!!this.top) return task;
		this.top = true;
		const taskFn = function(done) {
			asyncDone(task, ()=>{
				this.top = false;
				notifier.notify({
					title: 'Gulp Task Complete',
					message: `Gulp task: "${name}" has completed`,
					icon: path.join(__dirname, '/media/images/gulp.png'),
					wait: false
				});
				done();
			}, err=>{
				if (!!err) console.error(err);
			});
		}.bind(this);

		taskFn.displayName = name;
		return taskFn;
	}
}

module.exports = {
	Notifier_Registry
};
