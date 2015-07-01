'use strict';

var easyAsync = require('./index.js');

var exampleTask = function(callback){
  console.log('starting task');
  setTimeout(function(){
    console.log('done with task');
    callback();
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
  });
}


