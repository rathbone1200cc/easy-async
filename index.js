'use strict';

exports.start = function (firstFn, startFnOpt) {

  var dynOpt = {
    // default error handler will throw errors, to fail fast
    // (and encourage explicit error handling)
    onError: function (err) {
      throw err;
    }
  };

  var headOpt = {
    next: [firstFn || function (callback) {
      return callback();
    }]
  };
  var tailOpt = headOpt;

  // call the next target function(s), if possible, when appropriate
  var dispatch = function () {
    if (headOpt.open === 0 && headOpt.nextOpt) { // advance the head, if possible
      headOpt = headOpt.nextOpt;
    }
    if (headOpt.dispatching) {
      return;
    }
    headOpt.dispatching = true;
    headOpt.open = headOpt.open || 0;
    headOpt.callbacks = headOpt.callbacks || [false];

    var dispatchInternal = function (fnIndex) {
      headOpt.open += 1;
      headOpt.next[fnIndex](function (err) {
        if (headOpt.callbacks[fnIndex]) {
          throw new Error('function called back twice!');
        }
        headOpt.callbacks[fnIndex] = true;
        if (err) {
          return dynOpt.onError(err);
        }
        headOpt.open -= 1;
        dispatch();
      });
    };

    for (headOpt.fnIndex = headOpt.fnIndex || 0; headOpt.fnIndex < headOpt.next.length; headOpt.fnIndex += 1) {
      if (headOpt.wrapWithTry) {
        // setImmediate(function () {
        try {
          dispatchInternal(headOpt.fnIndex);
        } catch (err) {
          headOpt.open -= 1;
          dynOpt.onError(err);
        }
        // });
      } else {
        dispatchInternal(headOpt.fnIndex);
      }
    }
    headOpt.dispatching = false;
  };

  // the 'tail' is the control object
  // that closes over the necessary context
  // to allow more tasks to be added
  var tail = {
    // set the next fn, allowing the tail to advance
    thenStart: function (nextTargetFn, fnOpt) {
      tailOpt.nextOpt = {
        next: [nextTargetFn]
      };
      tailOpt = tailOpt.nextOpt;
      dispatch();
      return tail;
    },
    andStart: function (nextTargetFn, fnOpt) {
      tailOpt.next.push(nextTargetFn);
      dispatch();
      return tail;
    },
    onError: function (handler) {
      dynOpt.onError = handler;
      return tail;
    }
  };

  // start the first task
  // setImmediate(function () { // setImmediate to be nice to the event loop
  dispatch();
  // });

  return tail;
};
