'use strict';

exports.start = function (firstFn, startFnOpt) {

  var dynOpt = {
    // default error handler will throw errors, to fail fast
    // (and encourage explicit error handling)
    onError: function (err) {
      throw err;
    }
  };

  var head = {
    fns: [firstFn || function (callback) {
      return callback();
    }]
  };
  var tail = head;

  // call the next target function(s), if possible, when appropriate
  var dispatch = function () {
    if (head.open === 0 && head.next) { // advance the head, if possible
      head = head.next;
    }
    if (head.dispatching) {
      return;
    }
    head.dispatching = true;
    head.open = head.open || 0;
    head.callbacks = head.callbacks || [false];

    var dispatchInternal = function (fnIndex) {
      head.open += 1;
      head.fns[fnIndex](function (err) {
        if (head.callbacks[fnIndex]) {
          throw new Error('function called back twice!');
        }
        head.callbacks[fnIndex] = true;
        if (err) {
          return dynOpt.onError(err);
        }
        head.open -= 1;
        dispatch();
      });
    };

    for (head.fnIndex = head.fnIndex || 0; head.fnIndex < head.fns.length; head.fnIndex += 1) {
      if (head.wrapWithTry) {
        // setImmediate(function () {
        try {
          dispatchInternal(head.fnIndex);
        } catch (err) {
          head.open -= 1;
          dynOpt.onError(err);
        }
        // });
      } else {
        dispatchInternal(head.fnIndex);
      }
    }
    head.dispatching = false;
  };

  // the controller object closes over the necessary context
  // to allow more tasks to be added
  var controller = {
    // set the next fn, allowing the tail to advance
    thenStart: function (nextTargetFn, fnOpt) {
      tail.next = {
        fns: [nextTargetFn]
      };
      tail = tail.next;
      dispatch();
      return controller;
    },
    andStart: function (nextTargetFn, fnOpt) {
      tail.fns.push(nextTargetFn);
      dispatch();
      return controller;
    },
    onError: function (handler) {
      dynOpt.onError = handler;
      return controller;
    }
  };

  // start the first task
  // setImmediate(function () { // setImmediate to be nice to the event loop
  dispatch();
  // });

  return controller;
};
