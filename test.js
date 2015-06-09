'use strict';

var 
ea = require('./index.js'),
_ = require('lodash');

function cl(msg) {console.log(msg);}

function genRandAsync(key, msLimit, cbHash) {
  var f = function(callback){
    if (cbHash[key]){throw new Error(key + ' already called!');}
    cl('starting ' + key);
    var ms = Math.ceil(Math.random() * msLimit);
    setTimeout(function(){
      cl('finishing ' + key);
      if (cbHash[key]){throw new Error(key + ' already called back!');}
      cbHash[key] = true;
      callback();
    }, ms);
  };
  f.key = key;
  return f;
}
function genHashCheck(hash, keys, callback){
  return function(){
    var missing = _.filter(keys, function(key){return !hash[key];});
    if (missing.length > 0){
      var err = new Error('missing keys ' + missing.join(' '));
      callback(err);
    }
    else {callback();}
  };
}

describe('easy_async', function () {

  it('starts the async fn', function(done){
    var cbHash = {};
    ea.start(genRandAsync('a', 10, cbHash))
    .then(genHashCheck(cbHash, ['a'], done));
  });

  it('multiple series fn', function(done){
    var cbHash = {};
    ea.start(genRandAsync('a', 10, cbHash))
    .then(genRandAsync('b', 10, cbHash))
    .then(genHashCheck(cbHash, ['a', 'b'], done));
  });

  it('add fn to series, but not using chaining', function(done){
    var cbHash = {};
    var series = ea.start(genRandAsync('a', 10, cbHash));
    series.then(genRandAsync('b', 10, cbHash));
    series.then(genHashCheck(cbHash, ['a', 'b'], done));
  });

  it('add fn after earlier fn already called back', function(done){
    var cbHash = {};
    var series = ea.start(genRandAsync('a', 10, cbHash));
    series.then(function(callback){
      series.then(genRandAsync('b', 10, cbHash));
      series.then(genHashCheck(cbHash, ['a', 'b'], done));
      callback();
    });
  });

  it('mix up function additions', function(done){
    var cbHash = {};
    var series = ea.start(genRandAsync('a', 10, cbHash));
    var later;
    series.then(function(callback){
      later = series
        .then(genRandAsync('b', 10, cbHash))
        .then(genRandAsync('c', 10, cbHash));
      callback();
    });
    series.then(function(callback){
      later.then(genRandAsync('d', 10, cbHash));
      series
      .then(genRandAsync('e', 10, cbHash))
      .then(genHashCheck(cbHash, ['a', 'b', 'c', 'd', 'e'], done));
      callback();
    });
  });

  it('restart with function additions', function(done){
    var cbHash = {};
    var series = ea.start(genRandAsync('a', 10, cbHash));
    series.then(function(callback){
      callback();
      process.nextTick(function(){
        series.then(genRandAsync('b', 10, cbHash));
        series.then(genHashCheck(cbHash, ['a', 'b'], done));
      });
    });
  });

  it('restart with "and" function additions', function(done){
    var cbHash = {};
    var series = ea.start(genRandAsync('a', 10, cbHash));
    series.then(function(callback){
      callback();
      process.nextTick(function(){
        series.and(genRandAsync('b', 10, cbHash));
        series.then(genHashCheck(cbHash, ['a', 'b'], done));
      });
    });
  });

  it('start with multiple and functions', function(done){
    var cbHash = {};
    var series = ea.start(function(callback){callback();});
    series.and(genRandAsync('a', 10, cbHash));
    series.and(genRandAsync('b', 10, cbHash));
    series.and(genRandAsync('c', 10, cbHash));
    series.and(genRandAsync('d', 10, cbHash));
    series.and(genRandAsync('e', 10, cbHash));
    series.then(genHashCheck(cbHash, ['a', 'b', 'c', 'd', 'e'], done));
  });

  it('simple error caught', function(done){
    ea.start(function(){
      throw new Error('this should be caught and handled gracefully');
    })
    .then(function(){ done('this point should not be reached');})
    .onError(function(){done();});
  });

  it('simple non-thrown error captured', function(done){
    ea.start(function(callback){
      callback('this captured and handled gracefully');
    })
    .then(function(){ done('this point should not be reached');})
    .onError(function(){done();});
  });

  it('simple non-thrown error captured from nested function', function(done){
    ea.start(function(callback){
      process.nextTick(function(){
        callback('this captured and handled gracefully');
      });
    })
    .then(function(){ done('this point should not be reached');})
    .onError(function(){done();});
  });

  it('error caught after callback', function(done){
    ea.start(function(callback){
      callback();
      throw new Error('this should be caught and handled gracefully');
    })
    .then(function(){})
    .onError(function(){done();});
  });

  it('handle multiple calls back', function(done){
    ea.start(function(callback){
      callback();
      callback();
    })
    //.then(function(callback){ done();});  
    // this will also work, which is the nature of the double callback error
    .onError(function(){done();});
  });

});
