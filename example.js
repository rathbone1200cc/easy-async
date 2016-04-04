'use strict';

var easyAsync = require('./index.js');

var exampleTask = function (callback) {
  console.log('starting task');
  setTimeout(function () {
    console.log('done with task');
    callback();
  }, 1000);
};

var exampleErrorTask = function (callback) {
  console.log('starting task');
  setTimeout(function () {
    callback(new Error('BOOM!'));
  }, 1000);
};

/////////////////////////////////////////
// 3 tasks in series, 3 tasks in parallel
/////////////////////////////////////////

easyAsync.start(exampleTask)
.thenStart(exampleTask)
.thenStart(exampleTask)
.thenStart(function () {
  console.log('continuing after tasks in series');
  startParallelWork(); // passes control on to next example
});

// "thenStart" used above for tasks in series,
// "andStart" used below for tasks in parallel.

var startParallelWork = function () {
  easyAsync.start(exampleTask)
  .andStart(exampleTask)
  .andStart(exampleTask)
  .thenStart(function () {
    console.log('continuing after tasks in parallel');
    startRiskyWork();
  });
}

var startParallelWork = function () {
  easyAsync.start(exampleTask)
  .andStart(exampleTask)
  .andStart(exampleErrorTask)
  .thenStart(function () {
    console.log('continuing after risky work');
  })
  .onError(function (err) {
    console.log('error handler received an error');
    console.error(err);
  });
}


