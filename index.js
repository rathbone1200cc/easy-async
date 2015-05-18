'use strict';

var defaultErrorHandler = function(err, msg) {
  if (msg) {
    console.error(msg);
  }
  if (err.stack) {
    console.error(err.stack);
  }
  else {
    console.error(err);
  }
};

exports.start = function(firstFn) {

  var dynOpt = {
    onError: defaultErrorHandler
  };
  var headOpt, tailOpt;
  headOpt = tailOpt = {
    //key: 'head',
    next: [firstFn]
  };

  function dispatch(opt) { // call the target function
    //currOpt = opt;  // remove this - replace with better series tracking
    opt.open = opt.open || 0;
    opt.callbacks = opt.callbacks || [false];

    function dispatchInternal(fnIndex) {
      opt.next[fnIndex](function(err) {
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
            //opt.hasCalledNext = true;  // helper, can be removed
            dispatch(opt.nextOpt);
          }
        }
      });
    }

    for (opt.fnIndex = opt.fnIndex || 0; opt.fnIndex < opt.next.length; opt
      .fnIndex += 1) {
      opt.open += 1;
      try {
        dispatchInternal(opt.fnIndex);
      }
      catch (err) {
        opt.open -= 1;
        dynOpt.onError(err);
      }
    }
  }

  function makeTail() {

    return {
      // set the next fn, allowing the tail to advance
      then: function(nextTargetFn) {
        tailOpt.nextOpt = {
          //hasCalledNext: false,
        };
        var needsDispatch = tailOpt.complete ? true : false;
        if (tailOpt.fnIndex) {
          dispatch(tailOpt);
        }
        tailOpt = tailOpt.nextOpt;
        tailOpt.next = [nextTargetFn];
        //tailOpt.key = nextTargetFn.key  // helper, can be removed
        tail = makeTail();
        if (needsDispatch) {
          dispatch(tailOpt);
        }
        return tail;
      },
      and: function(nextTargetFn, fnOpt) {
        if (tailOpt.complete) {
          return tail.then(nextTargetFn, fnOpt);
        } // restart new step
        tailOpt.next.push(nextTargetFn);
        if (tailOpt.fnIndex) {
          dispatch(tailOpt);
        } // other parallel fns already kicked off.
        return tail;
      },
      onError: function(handler) {
        dynOpt.onError = handler;
        return tail;
      }
    };
  }

  var tail = makeTail();

  process.nextTick(function() { //nextTick to be nice to the event loop
    dispatch(headOpt);
  });
  return tail;
};