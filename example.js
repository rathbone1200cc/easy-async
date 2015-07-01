'use strict';

var easyAsync = require('./index.js');

var exampleTask = function(callback){
  console.log('starting task');
  setTimeout(function(){
    console.log('done with task');
    callback();
  }, 1000);
};

var exampleErrorTask = function(callback){
  console.log('starting task');
  setTimeout(function(){
    callback(new Error('BOOM!'));
  }, 1000);
};

/////////////////////////////////////////
// 3 tasks in series, 3 tasks in parallel
/////////////////////////////////////////

easyAsync.start(exampleTask)
.then(exampleTask)
.then(exampleTask)
.then(function() {
  console.log('continuing after tasks in series');
  startParallelWork(); // passes control on to next example
});

// "then" used above for tasks in series,
// "and" used below for tasks in parallel.

function startParallelWork() {
  easyAsync.start(exampleTask)
  .and(exampleTask)
  .and(exampleTask)
  .then(function() {
    console.log('continuing after tasks in parallel');
    startRiskyWork();
  });
}

function startParallelWork() {
  easyAsync.start(exampleTask)
  .and(exampleTask)
  .and(exampleErrorTask)
  .then(function() {
    console.log('continuing after risky work');
  })
  .onError(function(err){
    console.log('error handler received an error');
    console.error(err);
  });
}


