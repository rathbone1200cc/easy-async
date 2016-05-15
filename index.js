'use strict';

exports.start = function (firstFn, startFnOpt) {

  var errorCount = 0;
  var defaultOptions = {
    // default error handler will throw errors, to fail fast
    // (and encourage explicit error handling)
    onError: function (err) {
      throw err;
    },
    wrapWithTry: false
  };

  var allowedOptions = [
    'onError',
    'continueAfterError',
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
    head.open = head.open || 0;
    head.callbacks = head.callbacks || [false];

    var dispatchInternal = function (fnIndex) {
      head.open += 1;
      setImmediate(function () {
        var opts = makeOpts(head.opts[fnIndex]);
        if (!opts.continueAfterError && errorCount > 0) {
          return;
        }
        var handleError = function (err) {
          errorCount += 1;
          opts.onError(err, errorCount);
        };
        var callback = function (err) {
          if (head.callbacks[fnIndex]) {
            handleError(new Error('function called back twice!'));
          }
          head.callbacks[fnIndex] = true;
          if (err) {
            handleError(err);
          }
          head.open -= 1;
          setImmediate(dispatch);
        };
        if (opts.wrapWithTry) {
          try {
            head.fns[fnIndex](callback);
          } catch (err) {
            head.open -= 1;
            handleError(err);
          }
        } else {
          head.fns[fnIndex](callback);
        }
      });
    };

    for (head.fnIndex = head.fnIndex || 0; head.fnIndex < head.fns.length; head.fnIndex += 1) {
      dispatchInternal(head.fnIndex);
    }
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
    },
    changeDefaults: function (newDefaults) {
      defaultOptions = makeOpts(newDefaults);
      return controller;
    }
  };

  // start the first task
  dispatch();

  return controller;
};
