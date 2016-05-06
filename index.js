'use strict';

exports.start = function (firstFn, startFnOpt) {

  var dynOpt = {
    // default error handler will throw errors, to fail fast
    // (and encourage explicit error handling)
    onError: function (err) {
      throw err;
    }
  };

  // call the target function
  var dispatch = function (opt) {
    opt.open = opt.open || 0;
    opt.callbacks = opt.callbacks || [false];

    var dispatchInternal = function (fnIndex) {
      opt.open += 1;
      var startNext = function () {
        opt.next[fnIndex](function (err) {
          if (opt.callbacks[fnIndex]) {
            throw new Error('function called back twice!');
          }
          opt.callbacks[fnIndex] = true;

          if (err) {
            return dynOpt.onError(err);
          }

          opt.open -= 1;

          if (opt.open === 0) { // start the next fn, if possible
            opt.complete = true;
            if (opt.nextOpt) {
              dispatch(opt.nextOpt);
            }
          }
        });
      };
      if (opt.wrapWithTry) {
        // setImmediate(function () {
        try {
          startNext();
        } catch (err) {
          opt.open -= 1;
          dynOpt.onError(err);
        }
        // });
      } else {
        startNext();
      }
    };

    for (opt.fnIndex = opt.fnIndex || 0; opt.fnIndex < opt.next.length; opt.fnIndex += 1) {
      dispatchInternal(opt.fnIndex);
    }
  };

  var tailOpt = {
    next: [firstFn || function (callback) {
      return callback();
    }]
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
      var needsDispatch = tailOpt.complete;
      if (tailOpt.fnIndex) {
        dispatch(tailOpt);
      }
      tailOpt = tailOpt.nextOpt;
      if (needsDispatch) {
        dispatch(tailOpt);
      }
      return tail;
    },
    andStart: function (nextTargetFn, fnOpt) {
      if (tailOpt.complete) {
        return tail.thenStart(nextTargetFn, fnOpt);
      } // restart new step
      tailOpt.next.push(nextTargetFn);
      if (tailOpt.fnIndex) {
        dispatch(tailOpt);
      } // other parallel fns already kicked off.
      return tail;
    },
    onError: function (handler) {
      dynOpt.onError = handler;
      return tail;
    }
  };

  // start the first task
  // setImmediate(function () { // setImmediate to be nice to the event loop
  dispatch(tailOpt);
  // });

  return tail;
};
