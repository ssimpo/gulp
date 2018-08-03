# gulp-augment
Augment gulp with:

- Task importing
- Multiple roots
- Gulp cli detection and automatic loading
- Desktop notifications (Gulp4 only)
- Dependency injection
- Settings import

## Install

Using [NPM](https://www.npmjs.com/):

```javascript
npm install --save-dev "@simpo/gulp-augment"
```

Using [Yarn](https://yarnpkg.com/lang/en/):

```javascript
yarn add "@simpo/gulp-augment"
```

Using [PNPM](https://pnpm.js.org/):

```javascript
pnpm install --save-dev "@simpo/gulp-augment"
```

## What is gulp-augment

Gulp is awesome but I found myself constantly writing my helper functions and modules.  When you start to write the same helper code over and over again in different modules it is probably better to formalise it into a module.

Gulp Augment is a collection of gulp additions and tools to make life easier.  It is not an attempt to improve gulp or make it better, but rather a collection of helpful extras.

## Can I help?

I will always look favourably at PR requests any suggestions for improving things. This is especially true for bug fixes and code improvement. 

If you have any great additions that you use in your gulp workflow, I'd be interest to hear from you.  I can't promise to include them as we have to avoid bloat and functionality that is to too bespoke; however, anything that make gulping quicker, nicer or more efficient will be considered.

## Project status

**Permanent beta** - aka Google style

Basically, this module is stable and I will not be adding anything that breaks current functionality.  However, I am looking to add more and better functionality over time; hence, we are still beta as it might expand a lot be we call it stable.

## Gulp Versions

This module should work seamlessly in either gulp3 or gulp4.  Some minor functionality does not work in gulp3 but these are non-essential and non-breaking. Part of the idea of this module is cut across the differences between the two gulps so you don't have to remember what you used on a particular project.

## Getting started

Once you've installed the module you can simply use it as follows:

```javascript
// gulpfile.js
const {Augment_Registry} = require('gulp-augment);
const gulp4 = require('gulp4');

gulp.registry(new Augment_Registry());
```

...or using gulp3

```javascript
// gulpfile.js
const {augmentGulp} = require('gulp-augment);
const gulp = require('gulp');

augmentGulp(__dirname, gulp);
```

If you can't be bothered with detecting your gulp version you can simply do this:

```javascript
// gulpfile.js
const {augment} = require('gulp-augment);
const gulp = augment();
```

Obviously, this only works if you are loading via the cli and it is an experimental feature.

## Task importing

Gulp files quickly become large and difficult to decipher, dividing code into separate files is just sensible.  It also allows for better code sharing. 

You could just divide your code up and then do a bunch of requires; but, who can be bothered with that? If you put your file in the right place it would be nice if it just loaded.  No need for config and no need for extra code.

Augment will load all tasks in the gulp folder of your project root (the folder with gulpfile in it).  You can supply your root folder path or let augment assume it is the directory of the calling script (if that is gulpfile.js then your project root).

Each file in the gulp directory should export a function, array or object.

**Example:**

```javascript
function task(done) {
	// do something
	done()
}

module.exports = task;
```

In this example a new task will be added with the same name as the filename.  This task will run the above _task()_ function. If your script was stored at _./gulp/test_ then your task will be called **'test'** and you can access it from the cli as normal:

```bash
gulp test
```

...or

```bash
npx gulp test
```

If the file was stored at _./gulp/test/browser_ then your gulp task will be called **'test:browser'**. Augment will also respect the displayName property of your task function (as gulp does), so you can override thhe task name as follows:

```javascript
function task(done) {
	// do something
	done()
}

task.displayName = 'my-task';

module.exports = task;
```

If you export an object, augment is looking for the task function in the fn property.  So, this it identical to the above.

```javascript
function task(done) {
	// do something
	done()
}

module.exports = {fn:task, displayName:'my-task'};
```

### Task dependencies

You can fire dependent tasks before your main task before supplying a deps property.

**Example:**

```javascript
function fn(done) {
	// do something
	done()
}

module.exports = {
	fn,
	displayName:'my-task',
	deps:['first-task', 'second-task']
};
```

This will run _'first-task'_ then _'second-task'_, followed by _'my-task'_. This works in both gulp3 and gulp4 and is similar to the dependency property in gulp3 (except tasks run in series).

The tasks run in series as I think that is what most people will expect. You can run parallel tasks by setting arrays of arrays. Eg:

```javascript
function fn(done) {
	// do something
	done()
}

module.exports = {
	fn, 
	displayName:'my-task', 
	deps:[['first-task', 'second-task'],['third-task', 'fourth-task']]
};
```

This will run: _'first-task'_ and _'second-task'_ in parallel, then after them complete, run  _'third-task'_ and _'fourth-task'_ in parallel, after these complete, run _'my-task'_.

If there is no main task but this task is simply a means to run other tasks you can export an array:

```javascript
module.exports = [['first-task', 'second-task'],['third-task', 'fourth-task']];
```

Here the task just runs the deps but has no main task function. The task will be named after its filename.  Since, it is an array, you can also just have a json file instead and it'll run.

```json
[["first-task", "second-task"],["third-task", "fourth-task"]]
```

### Glob dependencies

Task deps can also be expressed as globs

```json
["test:*"]
```

This will run all the tasks starting with _'test:'_ in series. To run the same in parallel:

```json
[["test:*"]]
```

This is useful when may have a collection of tasks in a sub-directory that are related (eg. build or test tasks).  You can add new tasks and they will always be ran without have to specially add them to a parent task dependency.

## Multiple Roots

Augment can load from multiple roots simple by providing an an array as the root option. This can be useful if you have a global collection of tasks or in project where gulp is being called outside of the normal cli.

```javascript
// gulpfile.js
const {augment} = require('gulp-augment);
const gulp = augment({root:[__dirname, '~/']});
```

or, specifically in gulp3

```javascript
// gulpfile.js
const {augmentGulp} = require('gulp-augment);
const gulp = require('gulp');

augmentGulp([__dirname, '~/', gulp);
```

In these the tasks in __dirname/gulp and ~/gulp are loaded.

**NB:** The node *require()* function will be local to the task, so you may need to install dependant modules in your other roots. This is what you'd expect but it is easy to forget and wonder why the task keeps error-ing.

# Gulp cli detection and automatic loading (experimental)

Augment can attempt to detect the version of gulp the cli is expecting and try to load that gulp.

Two methods are exported for this purpose:

```javascript
// gulpfile.js
const {getGulpCliVersion, getCliGulp} = require('gulp-augment);

// get the gulp version expected by the cli.
// will return either 3 or 4 as numbers.
const version = getGulpCliVersion();

// use getGulpCliVersion() internally and then load the correct gulp.
// will load relative to the calling script (usually gulpfile.js).
const gulp = getCliGulp();
```

You can also use these two methods transparently and apply augment the same time:

```javascript
// gulpfile.js
const {augment} = require('gulp-augment);
const gulp = augment();
```

Here, augment is applied to either gulp3 or gulp4, depending on what the cli is expecting.  This smooths out the different ways of calling gulp that might result in a different version. If your tasks work in both (as most do), no need worry about gulp versions.

**NB:** These features are experimental but is safe to use. They are not going to go anywhere but it is possible there are methods of calling gulp it dose not detect correctly (yet).  If you find any please raise an issue.

## Desktop notifications (gulp4 only)

When a parent task is complete a desktop notification will fire to inform you.  This is useful in lon-running tasks or watchers.  You can keep the terminal minimised and be notified when it is done (every little helps!)  It should work on Linux, Mac and Windows.

**NB:** This only fires in gulp4 but we will push it to gulp3 as soon as possible.


# Dependency injection

Requiring all those gulp plugins can be quite a pain.  Augment provides dependency injection (aka. angular style) on your task functions.  Parameters for your task function are parsed and modules required in accordingly.

**Example:**

```javascript
function fn(done, gulp, replace, babel, rollup) {
	// Do something
}

module.exports = fn;
```

In the augment will supply a done() function for async done signalling (this is one gulp supplies itself but must be called _done_ in augment to differentiate it from other dependencies). It then supplies the gulp it is using, followed by _'gulp-replace'_, _'gulp-rollup'_ and finally _'rollup'_ (assuming _'gulp-rollup'_ is not available).

It works by first supplying any static dependencies it has set (usually, _gulp_, _settings_ or _done_) and then looking for kebab-case versions of gulp plugins of that name.  If these are not found it looks for simply kebab-case modules of that name, followed by camel-case.  This sounds complicated but is actually quite simple.

So, if we are we have a parameter called _betterRollup_:

 - Look for any static modules defined internally in augment called _betterRollup_.
 - Look for any modules called _'gulp-better-rollup'_.
 - Look for any modules called _'better-rollup'_.
 - Look for any modules called _'betterRollup'_.
 
The first module found is loaded.

**NB:** All requiring is done locally to the task file (rather than gulpfile.js), so if the task is located outside the scope of your gulpfile.js _node_modules_ directory you might need to install dependencies locally. This is what you'd expect and want but worth remembering.

# Settings import

Augment has an internal static module (available via dependency injection) called ***settings***. Settings will be an objects of settings retrieved from the following locations andf merged together:

 - The *gulp* property of ***package.json**.
 - The *name* property of ***package.json**.
 - The contents of **gulp.json**.
 - The contents of **local.json**.
 
 The data in each of these locations is loaded and merged together to supply the settings object. The files do not need to be supplied, if they are not available they are not loaded.
 
 You can use these settings files how you like but the is:
 
 - ***pasckage.json*** has your settings in
 - ***gulp.json*** can be used if settings in ***package.json*** are becoming too large and you need to separate it out.  In this case ***package.json*** can be use for settings thhat are solid and to do with the other-all project (eg. naming and versioning).
 - ***local.json*** is for local overrides (it loads last and will override previous settings) and can be used for user or machine overrides.  It is best in this case to keep ***local.json*** out of **.gitignore**. 
 
 
 The settings are loaded from the local root.  So each task might have different settings if loaded from different root directories.
 
## Templating in settings
 
 The settings loader will parse any _${variable}_ text (ES6 Template style) using thhe settings object as its source.  So the following json:
 
 ```json
 {
 	"param1": "HELLO BIG WIDE WORLD",
 	"param3": {
 		"param3.1": "HELLO WORLD!"
 	},
 	"param2": "${param1}"
 	"param4": "${param3['param3.1']}"
 }
 ```
 
 ...will become
 
  ```json
  {
  	"param1": "HELLO BIG WIDE WORLD",
  	"param3": {
  		"param3.1": "HELLO WORLD!"
  	},
  	"param2": "HELLO BIG WIDE WORLD",
  	"param4": "HELLO WORLD"
  }
  ```