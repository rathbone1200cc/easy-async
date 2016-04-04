/* globals describe, it */
'use strict';

var ea = require('./index.js');
var _ = require('lodash');

// function cl(msg) {console.log(msg);}

var genRandAsync = function (key, msLimit, cbHash) {
  var f = function (callback) {
    if (cbHash[key]) {
      throw new Error(key + ' already called!');
    }
    // cl('starting ' + key);
    var ms = Math.ceil(Math.random() * msLimit);
    setTimeout(function () {
      // cl('finishing ' + key);
      if (cbHash[key]) {
        throw new Error(key + ' already called back!');
      }
      cbHash[key] = true;
      callback();
    }, ms);
  };
  f.key = key;
  return f;
};

var genHashCheck = function (hash, keys, callback) {
  return function () {
    var missing = _.filter(keys, function (key) {
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

describe('easy_async', function () {

  it('starts the async fn', function (done) {
    var cbHash = {};
    ea.start(genRandAsync('a', 10, cbHash))
    .thenStart(genHashCheck(cbHash, ['a'], done));
  });

  it('allow calls to start with no fn', function (done) {
    var cbHash = {};
    ea.start()
    .thenStart(genRandAsync('a', 10, cbHash))
    .thenStart(genHashCheck(cbHash, ['a'], done));
  });

  it('multiple series fn', function (done) {
    var cbHash = {};
    ea.start(genRandAsync('a', 10, cbHash))
    .thenStart(genRandAsync('b', 10, cbHash))
    .thenStart(genHashCheck(cbHash, ['a', 'b'], done));
  });

  it('add fn to series, but not using chaining', function (done) {
    var cbHash = {};
    var series = ea.start(genRandAsync('a', 10, cbHash));
    series.thenStart(genRandAsync('b', 10, cbHash));
    series.thenStart(genHashCheck(cbHash, ['a', 'b'], done));
  });

  it('add fn after earlier fn already called back', function (done) {
    var cbHash = {};
    var series = ea.start(genRandAsync('a', 10, cbHash));
    series.thenStart(function (callback) {
      series.thenStart(genRandAsync('b', 10, cbHash));
      series.thenStart(genHashCheck(cbHash, ['a', 'b'], done));
      callback();
    });
  });

  it('mix up function additions', function (done) {
    var cbHash = {};
    var series = ea.start(genRandAsync('a', 10, cbHash));
    var later;
    series.thenStart(function (callback) {
      later = series
        .thenStart(genRandAsync('b', 10, cbHash))
        .thenStart(genRandAsync('c', 10, cbHash));
      callback();
    });
    series.thenStart(function (callback) {
      later.thenStart(genRandAsync('d', 10, cbHash));
      series
      .thenStart(genRandAsync('e', 10, cbHash))
      .thenStart(genHashCheck(cbHash, ['a', 'b', 'c', 'd', 'e'], done));
      callback();
    });
  });

  it('restart with function additions', function (done) {
    var cbHash = {};
    var series = ea.start(genRandAsync('a', 10, cbHash));
    series.thenStart(function (callback) {
      callback();
      process.nextTick(function () {
        series.thenStart(genRandAsync('b', 10, cbHash));
        series.thenStart(genHashCheck(cbHash, ['a', 'b'], done));
      });
    });
  });

  it('restart with "and" function additions', function (done) {
    var cbHash = {};
    var series = ea.start(genRandAsync('a', 10, cbHash));
    series.thenStart(function (callback) {
      callback();
      process.nextTick(function () {
        series.andStart(genRandAsync('b', 10, cbHash));
        series.thenStart(genHashCheck(cbHash, ['a', 'b'], done));
      });
    });
  });

  it('start with multiple and functions', function (done) {
    var cbHash = {};
    var series = ea.start(function (callback) {
      callback();
    });
    series.andStart(genRandAsync('a', 10, cbHash));
    series.andStart(genRandAsync('b', 10, cbHash));
    series.andStart(genRandAsync('c', 10, cbHash));
    series.andStart(genRandAsync('d', 10, cbHash));
    series.andStart(genRandAsync('e', 10, cbHash));
    series.thenStart(genHashCheck(cbHash, ['a', 'b', 'c', 'd', 'e'], done));
  });

  it('simple error caught', function (done) {
    var err = new Error('this should be caught and handled gracefully');
    ea.start(function () {
      throw err;
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

  it('error caught after callback', function (done) {
    ea.start(function (callback) {
      callback();
      throw new Error('this should be caught and handled gracefully');
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
