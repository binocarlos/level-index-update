var level    = require('level-test')()
var sublevel = require('level-sublevel')
var updateindex   = require('../')

var tape     = require('tape')


var db = sublevel(level('level-index-update--noautokey', {encoding: 'json'}))

var indexer = updateindex(db, 'manualkey', function(key, value, emit){

  emit(['color', value.color, key, '_'], true);
})

tape('dont auto add key when flag is set', function(t){
  indexer.save('myfavoritecolor', {color:'red',height:50}, function(err, batch){
    if(err)
      throw err
    t.equal(batch.length, 2)
    t.equal(batch[0].type, 'put')
    t.equal(batch[1].type, 'put')
    t.equal(batch[1].key, '\xffmanualkey\xffcolor~red~myfavoritecolor~_')
    t.end()
  })

})