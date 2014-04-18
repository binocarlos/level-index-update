var level    = require('level-test')()
var sublevel = require('level-sublevel')
var updateindex   = require('../')

var tape     = require('tape')


var db = sublevel(level('level-index-update--batch', {encoding: 'json'}))

var indexer = updateindex(db, 'orangeindex', function(key, value, emit){

  if(!value){
    throw new Error('ts')
  }
  emit(['color', value.color]);
})

tape('cascade a batch with the indexes', function(t){

  indexer.batch([{
    type:'put',
    key:'item1',
    value:{
      color:'red'
    }
  },{
    type:'put',
    key:'item2',
    value:{
      color:'blue'
    }
  }], function(err, batch){
    if(err)
      throw err

    t.equal(batch.length, 4)
    t.equal(batch[0].type, 'put')
    t.equal(batch[1].type, 'put')
    t.equal(batch[2].type, 'put')
    t.equal(batch[3].type, 'put')
    t.equal(batch[0].key, 'item1')
    t.equal(batch[1].key, '\xfforangeindex\xffcolor~red~item1')
    t.equal(batch[1].prefix, indexer.db)
    t.equal(batch[2].key, 'item2')
    t.equal(batch[3].key, '\xfforangeindex\xffcolor~blue~item2')
    t.equal(batch[3].prefix, indexer.db)


    indexer.batch([{
      type:'del',
      key:'item1'
    },{
      type:'put',
      key:'item2',
      value:{
        color:'green'
      }
    }], function(err, batch){

      t.equal(batch.length, 5)
      t.equal(batch[0].type, 'del')
      t.equal(batch[0].key, 'item1')

      t.equal(batch[1].type, 'del')
      t.equal(batch[1].key, '\xfforangeindex\xffcolor~red~item1')

      t.equal(batch[2].type, 'put')
      t.equal(batch[2].key, 'item2')

      t.equal(batch[3].type, 'del')
      t.equal(batch[3].key, '\xfforangeindex\xffcolor~blue~item2')

      t.equal(batch[4].type, 'put')
      t.equal(batch[4].key, '\xfforangeindex\xffcolor~green~item2')

      t.end();


    })

  })

})