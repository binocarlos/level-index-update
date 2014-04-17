var level    = require('level-test')()
var sublevel = require('level-sublevel')
var updateindex   = require('../')

var tape     = require('tape')


var db = sublevel(level('level-index-update--simple', {encoding: 'json'}))

db.save = updateindex(db, function(key, value, emit){
  emit(['color', value.color]);
  emit(['heightcolor', value.height, value.color])
})

tape('insert, update and read the batch', function(t){
  db.save('myfavoritecolor', {color:'red',height:50}, function(err, batch){
    if(err)
      throw err
    t.equal(batch.length, 3)
    t.equal(batch[0].type, 'put')
    t.equal(batch[1].type, 'put')
    t.equal(batch[2].type, 'put')
    t.equal(batch[0].key, 'myfavoritecolor')
    t.equal(batch[1].key, 'color~red~myfavoritecolor')
    t.equal(batch[2].key, 'heightcolor~50~red~myfavoritecolor')
    db.save('myfavoritecolor', {color:'blue',height:45}, function(err, batch){
      t.equal(batch.length, 5)
      t.equal(batch[0].type, 'put')
      t.equal(batch[1].type, 'del')
      t.equal(batch[2].type, 'del')
      t.equal(batch[3].type, 'put')
      t.equal(batch[4].type, 'put')

      t.equal(batch[0].key, 'myfavoritecolor')
      t.equal(batch[1].key, 'color~red~myfavoritecolor')
      t.equal(batch[2].key, 'heightcolor~50~red~myfavoritecolor')
      t.equal(batch[3].key, 'color~blue~myfavoritecolor')
      t.equal(batch[4].key, 'heightcolor~45~blue~myfavoritecolor')
      t.end()
    })
  })

})