/* globals describe, it */
'use strict';

var ea = require('./index.js');
var _ = require('lodash');

var randAsync = function (key, msLimit, cbHash, cbArray) {
  cbHash = cbHash || {};
  cbArray = cbArray || [];
  var f = function (callback) {
    if (cbHash[key]) {
      throw new Error(key + ' already called!');
    }
    var ms = Math.ceil(Math.random() * msLimit);
    setTimeout(function () {
      if (cbHash[key]) {
        throw new Error(key + ' already called back!');
      }
      cbHash[key] = true;
      cbArray.push(key);
      callback();
    }, ms);
  };
  return f;
};

var hashCheck = function (hash, keyChars, outerCallback) {
  return function (innerCallback) {
    var callback = outerCallback || innerCallback;
    var missing = _.filter(keyChars, function (key) {
      return !hash[key];
    });
    if (missing.length > 0) {
      var err = new Error('missing keys ' + missing.join(' '));
      callback(err);
    } else {
      callback();
    }
  };
};

var arrayCheck = function (array, keyChars, outerCallback) {
  return function (innerCallback) {
    var callback = outerCallback || innerCallback;
    var arrayAsString = array.join('');
    if (arrayAsString === keyChars) {
      return callback();
    }
    return callback(new Error('expecting (in order) ' + keyChars + ' but found ' + arrayAsString));
  };
};

describe('easy_async', function () {

  it('starts the async fn', function (done) {
    var cbHash = {};
    ea.start(randAsync('a', 10, cbHash))
    .thenStart(hashCheck(cbHash, 'a', done));
  });

  it('allow calls to start with no fn', function (done) {
    var cbHash = {};
    ea.start()
    .andStart(randAsync('a', 10, cbHash))
    .thenStart(randAsync('b', 10, cbHash))
    .andStart(randAsync('c', 10, cbHash))
    .thenStart(hashCheck(cbHash, 'abc', done));
  });

  it('multiple series fn', function (done) {
    var cbArray = [];
    ea.start(randAsync('a', 10, null, cbArray))
    .thenStart(randAsync('b', 10, null, cbArray))
    .thenStart(randAsync('c', 10, null, cbArray))
    .thenStart(randAsync('d', 10, null, cbArray))
    .thenStart(randAsync('e', 10, null, cbArray))
    .thenStart(randAsync('f', 10, null, cbArray))
    .thenStart(randAsync('g', 10, null, cbArray))
    .thenStart(arrayCheck(cbArray, 'abcdefg', done));
  });

  it('mixed series and parallel', function (done) {
    var cbHash = {};
    var cbArray = [];
    ea.start(randAsync('a', 10, cbHash, cbArray))
    .andStart(randAsync('b', 10, cbHash, null))
    .thenStart(randAsync('c', 10, cbHash, null))
    .andStart(randAsync('d', 10, cbHash, cbArray))
    .thenStart(randAsync('e', 10, cbHash, cbArray))
    .andStart(randAsync('f', 10, cbHash, null))
    .andStart(randAsync('g', 10, cbHash, null))
    .thenStart(hashCheck(cbHash, 'abcdefg'))
    .thenStart(arrayCheck(cbArray, 'ade', done));
  });

  it('add fn to series, but not using chaining', function (done) {
    var cbArray = [];
    var series = ea.start(randAsync('a', 10, null, cbArray));
    series.thenStart(randAsync('b', 10, null, cbArray));
    series.thenStart(arrayCheck(cbArray, 'ab', done));
  });

  it('add fn after earlier fn already called back', function (done) {
    var cbHash = {};
    var series = ea.start(randAsync('a', 10, cbHash));
    series.thenStart(function (callback) {
      series.thenStart(randAsync('b', 10, cbHash));
      series.thenStart(hashCheck(cbHash, 'ab', done));
      callback();
    });
  });

  it('mix up function additions', function (done) {
    var cbHash = {};
    var series = ea.start(randAsync('a', 10, cbHash));
    var later;
    series.thenStart(function (callback) {
      later = series
        .thenStart(randAsync('b', 10, cbHash))
        .thenStart(randAsync('c', 10, cbHash));
      callback();
    });
    series.thenStart(function (callback) {
      later.thenStart(randAsync('d', 10, cbHash));
      series
      .thenStart(randAsync('e', 10, cbHash))
      .thenStart(hashCheck(cbHash, 'abcde', done));
      callback();
    });
  });

  it('restart with function additions', function (done) {
    var cbHash = {};
    var series = ea.start(randAsync('a', 10, cbHash));
    series.thenStart(function (callback) {
      callback();
      process.nextTick(function () {
        series.thenStart(randAsync('b', 10, cbHash));
        series.thenStart(hashCheck(cbHash, 'ab', done));
      });
    });
  });

  it('restart with "andStart" function additions', function (done) {
    var cbHash = {};
    var series = ea.start(randAsync('a', 10, cbHash));
    series.thenStart(function (callback) {
      callback();
      setTimeout(function () {
        series.andStart(function(){
          done();
        });
      }, 15);
    });
  });

  it('start with multiple and functions', function (done) {
    var cbHash = {};
    var series = ea.start(function (callback) {
      callback();
    });
    series.andStart(randAsync('a', 10, cbHash));
    series.andStart(randAsync('b', 10, cbHash));
    series.andStart(randAsync('c', 10, cbHash));
    series.andStart(randAsync('d', 10, cbHash));
    series.andStart(randAsync('e', 10, cbHash));
    series.thenStart(hashCheck(cbHash, 'abcde', done));
  });

  // no easy way to test this automatically
  // change xit to it, verify that the unhandled error bubbles out
  xit('thrown error not caught by easy-async', function (done) {
    var err = new Error('this should be unhandled - not caught by easy-async');
    ea.start(function () {
      throw err;
    })
    .thenStart(function () {
      done(new Error('this point should not be reached'));
    })
    .onError(function () {
      done(new Error('thrown error should not have been caught'));
    });
    setImmediate(done);
  });

  it('simple non-thrown error captured', function (done) {
    var errMsg = 'this captured and handled gracefully';
    ea.start(function (callback) {
      callback(errMsg);
    })
    .thenStart(function () {
      done('this point should not be reached');
    })
    .onError(function (err) {
      if (err !== errMsg) {
        done(new Error('error message not passed to handler'));
      }
      done();
    });
  });

  describe('wrapWithTry', function () {

    it('simple error caught', function (done) {
      var err = new Error('this should be caught and handled gracefully');
      ea.start(function () {
        throw err;
      }, {
        wrapWithTry: true
      })
      .thenStart(function () {
        done('this point should not be reached');
      })
      .onError(function (handledErr) {
        if (err !== handledErr) {
          done(new Error('error not passed to handler'));
        }
        done();
      });
    });

    it('error caught after callback', function (done) {
      ea.start(function (callback) {
        callback();
        throw new Error('this should be caught and handled gracefully');
      }, {
        wrapWithTry: true
      })
      .thenStart(function () {
        done(new Error('error handler should have been called, and this point not reached.'));
      })
      .onError(function () {
        done();
      });
    });

    it('handle error of multiple calls back', function (done) {
      ea.start(function (callback) {
        callback();
        callback();
      })
      // .thenStart(function (callback) { done();});
      // this will also work, which is the nature of the double callback error
      .onError(function () {
        done();
      });
    });
  });

});
