var level    = require('level-test')()
var sublevel = require('level-sublevel')
var updateindex   = require('../')

var tape     = require('tape')


var db = sublevel(level('level-index-update--single', {encoding: 'json'}))



tape('insert, update and read single documents', function(t){

  var indexer = updateindex(db, 'singleindex', function(key, value, emit, type){
    t.equal((type=='put' || type=='del'), true)
    emit(['color', value.color]);
    emit(['heightcolor', value.height, value.color])
  })

  indexer.save('myfavoritecolor', {color:'red',height:50}, function(err, batch){
    if(err)
      throw err
    t.equal(batch.length, 3)
    t.equal(batch[0].type, 'put')
    t.equal(batch[1].type, 'put')
    t.equal(batch[2].type, 'put')
    t.equal(batch[0].key, 'myfavoritecolor')
    t.equal(batch[1].key, '\xffsingleindex\xffcolor~red~myfavoritecolor')
    t.equal(batch[2].key, '\xffsingleindex\xffheightcolor~50~red~myfavoritecolor')
    indexer.save('myfavoritecolor', {color:'blue',height:45}, function(err, batch){
      t.equal(batch.length, 5)
      t.equal(batch[0].type, 'put')
      t.equal(batch[1].type, 'del')
      t.equal(batch[2].type, 'del')
      t.equal(batch[3].type, 'put')
      t.equal(batch[4].type, 'put')

      t.equal(batch[0].key, 'myfavoritecolor')
      t.equal(batch[1].key, '\xffsingleindex\xffcolor~red~myfavoritecolor')
      t.equal(batch[2].key, '\xffsingleindex\xffheightcolor~50~red~myfavoritecolor')
      t.equal(batch[3].key, '\xffsingleindex\xffcolor~blue~myfavoritecolor')
      t.equal(batch[4].key, '\xffsingleindex\xffheightcolor~45~blue~myfavoritecolor')
      t.end()
    })
  })

})