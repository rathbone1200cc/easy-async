'use strict';

var easyAsync = require('./index.js');

var exampleTask = function (callback) {
  console.log('starting task'); // eslint-disable-line no-console
  setTimeout(function () {
    console.log('done with task'); // eslint-disable-line no-console
    callback();
  }, 1000);
};

var exampleErrorTask = function (callback) {
  console.log('starting task (which will call back with an Error)'); // eslint-disable-line no-console
  setTimeout(function () {
    callback(new Error('BOOM!'));
  }, 1000);
};

// error from exampleErrorTask routed to onError handler
var startRiskyWork = function () {
  easyAsync.start(exampleTask)
  .andStart(exampleTask)
  .andStart(exampleErrorTask)
  .thenStart(function () {
    console.log('This point should not be reached'); // eslint-disable-line no-console
  })
  .onError(function (err) {
    console.log('error handler received an error:' + err); // eslint-disable-line no-console
  });
};

// "andStart" used below for tasks in parallel.
var startParallelWork = function () {
  easyAsync.start(exampleTask)
  .andStart(exampleTask)
  .andStart(exampleTask)
  .thenStart(function () {
    console.log('continuing after tasks in parallel'); // eslint-disable-line no-console
    startRiskyWork();
  });
};

// "thenStart" used for tasks in series
easyAsync.start(exampleTask)
.thenStart(exampleTask)
.thenStart(exampleTask)
.thenStart(function () {
  console.log('continuing after tasks in series'); // eslint-disable-line no-console
  startParallelWork(); // passes control on to next example
});

