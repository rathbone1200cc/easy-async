'use strict';

exports.start = function (firstFn) {

  var dynOpt = {
    // default error handler will throw errors, to fail fast
    // (and encourage explicit error handling)
    onError: function (err) {
      throw err;
    }
  };

  var headOpt, tailOpt;
  headOpt = tailOpt = {
    next: [firstFn || function (callback) {
      return callback();
    }]
  };

  var dispatch = function (opt) { // call the target function
    opt.open = opt.open || 0;
    opt.callbacks = opt.callbacks || [false];

    var dispatchInternal = function (fnIndex) {
      opt.open += 1;
      process.nextTick(function () {
        try {
          opt.next[fnIndex](function (err) {
            if (opt.callbacks[fnIndex]) {
              throw new Error('function called back twice!');
            } // helper, can be removed
            opt.callbacks[fnIndex] = true;

            if (err) {
              return dynOpt.onError(err);
            }

            opt.open -= 1;

            if (opt.open === 0) { // start the next fn, if possible
              opt.complete = true;
              if (opt.nextOpt) {
                // opt.hasCalledNext = true;  // helper, can be removed
                dispatch(opt.nextOpt);
              }
            }
          });
        } catch (err) {
          opt.open -= 1;
          dynOpt.onError(err);
        }
      });
    };

    for (opt.fnIndex = opt.fnIndex || 0; opt.fnIndex < opt.next.length; opt.fnIndex += 1) {
      dispatchInternal(opt.fnIndex);
    }
  };

  process.nextTick(function () { // nextTick to be nice to the event loop
    dispatch(headOpt);
  });

  var tail;
  var makeTail = function () {
    return {
      // set the next fn, allowing the tail to advance
      thenStart: function (nextTargetFn) {
        tailOpt.nextOpt = {};
        var needsDispatch = tailOpt.complete ? true : false;
        if (tailOpt.fnIndex) {
          dispatch(tailOpt);
        }
        tailOpt = tailOpt.nextOpt;
        tailOpt.next = [nextTargetFn];
        // tailOpt.key = nextTargetFn.key  // helper, can be removed
        tail = makeTail();
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
  };
  tail = makeTail();

  return tail;
};
