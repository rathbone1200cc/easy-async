# easy-async

easy-async is a library that helps coordinate asynchronous tasks, similar to [Promises](https://www.promisejs.org/) and [async.js](https://github.com/caolan/async).

Like Promises, you get a "control object" that wraps an asynchronous task. The control object allows you to declare what to do after (or at the same time) as the wrapped task.

Like async.js, easy-async will NOT attempt to plumb arguments through your tasks.  Also like async.js, the tasks will fail fast if any task produces an error.

## Quickstart

Get started with easy-async:

    npm install --save easy-async

# Examples

You can see the examples [together in a script here](example.js)

Tasks receive only one parameter, the callback provided by easy-async.  Each task must call the callback, and easy-async will only look for one single argument and assume it's an error.

``` javascript
var exampleTask = function(callback){
  console.log('starting task');
  setTimeout(function(){
    console.log('done with task');
    callback();
  }, 1000);
}

var exampleErrorTask = function(callback){
  console.log('starting task');
  setTimeout(function(){
    callback(new Error('BOOM!'));
  }, 1000);
};
```

To run through tasks in series, get the control object with 'start', then line up tasks with the 'thenStart' method on the control object:

``` javascript
easyAsync.start(exampleTask)
.thenStart(exampleTask)
.thenStart(exampleTask)
.thenStart(function() {
  console.log('continuing after tasks in series');
});
```

To run tasks in parallel, use the 'andStart' method on the control object:

``` javascript
easyAsync.start(exampleTask)
.andStart(exampleTask)
.andStart(exampleTask)
.thenStart(function() {
  console.log('continuing after tasks in parallel');
});
```

To attach an error handler, use the 'onError' method on the control object:

``` javascript
easyAsync.start(exampleTask)
.andStart(exampleTask)
.andStart(exampleErrorTask)
.thenStart(function() {
  console.log('continuing after risky work');
})
.onError(function(err){
  console.log('error handler received an error');
  console.error(err);
});
```

# API

The easy-fix module exports only one method: `start`.  The `start` method returns the "control object" (kind of like a promise) which contains the other methods listed here.

## `start(callback, options)`

Create and return the control object, and start the `callback` task.  The control object has the other methods listed here. The `options` are the same as `thenStart` and `andStart` methods (listed below). As a convenience, the `callback` can be null.

The `callback` is called with exactly one argument (a callback) which it must call to continue the easy-fix asynchronous task execution.

## `thenStart(callback, options)`

Run the `callback` after all previous callbacks to `thenStart` and `andStart` have completed.  Use this to declare tasks to run in series.

The `callback` is called with exactly one argument (a callback) which it must call to continue the easy-fix asynchronous task execution.

## `andStart(callback, options)`

Run the `callback` in parallel with a previous callback from `thenStart`, as well as any other other callbacks from successive calls to `andStart`. Use this to declare tasks to execute in parallel.

The `callback` is called with exactly one argument (a callback) which it must call to continue the easy-fix asynchronous task execution.

## `onError(callback)`

Specify a custom error handler.  The default error handler simply throws the error.

The error handler `callback` is called with two arguments: `(error, errorIndex)`.

The `error` is the same error that was passed in to any task callback or caught by a try/catch block (when `wrapWithTry` is specified as an option).

The `errorIndex` is a count (starting at 1) of all errors encountered by this control object.
As an example use case, easy-async may be used to coordinate multiple tasks in parallel when preparing a response to a single web request. Several of the tasks may generate errors - and the `errorIndex` may be used to guarantee that the error handler will only attempt to respond once to that web request.

## `changeDefaults(options)`

Specify new default options, which apply to all futher tasks added with `thenStart` and `andStart`.

# Options

Options can be specified per-task, or by calling the `changeDefaults` method.

* `wrapWithTry` - If true, tasks will be wrapped in a try/catch block, and caught errors passed through the `onError` handler. Default is `false`.
* `onError` - specify a custom error handler.  The default error handler simply throws the error.

# Stay up to date

As of June 2016, the new easy-async v1 has some very prudent *breaking changes* (and new features)!
Please read the [change log](CHANGELOG.md)!

# Shout out

Thanks to [Scott](https://github.com/scottnonnenberg) and [Jamie](https://github.com/uipoet) for advice on this project.

# License

The MIT License (MIT)

Copyright (c) 2016 - Dan Rathbone <rathbone1200cc@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

