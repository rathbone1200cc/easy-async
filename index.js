'use strict';

exports.start = function (firstFn, startFnOpt) {

  var defaultOptions = {
    // default error handler will throw errors, to fail fast
    // (and encourage explicit error handling)
    onError: function (err) {
      throw err;
    }
  };

  var allowedOptions = [
    'wrapWithTry'
  ];
  var makeOpts = function (fnOptsArg) {
    var fnOpts = fnOptsArg || {};
    var opts = {};
    var opt;
    for (var i = 0; i < allowedOptions.length; i += 1) {
      opt = allowedOptions[i];
      opts[opt] = typeof fnOpts[opt] === 'undefined' ? defaultOptions[opt] : fnOpts[opt];
    }
    return opts;
  };

  var head = {
    fns: [firstFn || function (callback) {
      return callback();
    }],
    opts: [startFnOpt]
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

    var dispatchInternal = function (fnIndex, opts) {
      head.open += 1;
      var callback = function (err) {
        if (head.callbacks[fnIndex]) {
          throw new Error('function called back twice!');
        }
        head.callbacks[fnIndex] = true;
        if (err) {
          return defaultOptions.onError(err);
        }
        head.open -= 1;
        dispatch();
      };
      // setImmediate(function () {
        if (opts.wrapWithTry) {
          try {
            head.fns[fnIndex](callback);
          } catch (err) {
            head.open -= 1;
            defaultOptions.onError(err);
          }
        } else {
          head.fns[fnIndex](callback);
        }
      // });
    };

    var opts;
    for (head.fnIndex = head.fnIndex || 0; head.fnIndex < head.fns.length; head.fnIndex += 1) {
      opts = makeOpts(head.opts[head.fnIndex]);
      dispatchInternal(head.fnIndex, opts);
    }
    head.dispatching = false;
  };

  // the controller object closes over the necessary context
  // to allow more tasks to be added
  var controller = {
    // set the next fn, allowing the tail to advance
    thenStart: function (nextTargetFn, fnOpt) {
      tail.next = {
        fns: [nextTargetFn],
        opts: [fnOpt]
      };
      tail = tail.next;
      dispatch();
      return controller;
    },
    andStart: function (nextTargetFn, fnOpt) {
      tail.fns.push(nextTargetFn);
      tail.opts.push(fnOpt);
      dispatch();
      return controller;
    },
    onError: function (handler) {
      defaultOptions.onError = handler;
      return controller;
    }
  };

  // start the first task
  dispatch();

  return controller;
};
