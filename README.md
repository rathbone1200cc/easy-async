# easy-async

easy-async is a library that helps coordinate asynchronous tasks, similar to [Promises](https://www.promisejs.org/) and [async.js](https://github.com/caolan/async).

Like Promises, you get a "control object" that wraps an asynchronous task. The control object allows you to declare what to do after (or at the same time) as the wrapped task.

Like async.js, easy-async will NOT attempt to plumb arguments through your tasks.  Also like async.js, the tasks will fail fast if any task produces an error.

Let's look at some examples.  You can see the examples [together here](example.js)

Tasks receive only one parameter, the callback provided by easy-async.  Each task must call the callback, and easy-async will only look for one single argument and assume it's an error.

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

To run through tasks in series, get the control object with 'start', then line up tasks with the 'thenStart' method on the control object:

    easyAsync.start(exampleTask)
    .thenStart(exampleTask)
    .thenStart(exampleTask)
    .thenStart(function() {
      console.log('continuing after tasks in series');
    });

To run tasks in parallel, use the 'andStart' method on the control object:

    easyAsync.start(exampleTask)
    .andStart(exampleTask)
    .andStart(exampleTask)
    .thenStart(function() {
      console.log('continuing after tasks in parallel');
    });

To attach an error handler, use the 'onError' method on the control object:


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
