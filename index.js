var pull = require('pull-stream')

module.exports = UpdateIndex

function UpdateIndex(db, indexDb, mapper) {

  if(arguments.length<=2){
    mapper = indexDb
    indexDb = null
  }
    
  if(!indexDb)
    indexDb = 'updateindex' //default to name of this module.

  if('string' === typeof indexDb)
    indexDb = db.sublevel(indexDb)

  function collectIndexes(command, oldvalue){

    var batch = [command];

    function emitter(type){
      return function emit(values, nopath){
        if(!nopath){
          values = (values || []).concat(command.key)
        }
        batch.push({
          type:type,
          key:(values || []).join('~'),
          value:0,
          prefix:indexDb
        })
      }
    }

    if(oldvalue)
      mapper(command.key, oldvalue, emitter('del'), 'del')

    if(command.value)
      mapper(command.key, command.value, emitter('put'), 'put')

    var seen = {}
    var newbatch = []

    for(var i=batch.length-1; i>=0; i--){
      var cmd = batch[i]
      batchkey = cmd.type + cmd.key
      if(!seen[batchkey]){
        seen[batchkey] = true
        newbatch.unshift(batch[i])
      }
    }

    return newbatch;
  }

  var indexer = {}

  indexer.db = indexDb;

  indexer.manifest = {
    methods: {
      save: { type: 'async' },
      batch: { type: 'async' },
      expandBatch: { type: 'async' }
    }
  };

  indexer.expandBatch = function processBatch(batch, callback){

    pull(
      pull.values(batch),

      pull.asyncMap(function (data, cb) {
        
        db.get(data.key, function(err, oldvalue){

          cb(null, collectIndexes(data, oldvalue))

        })

      }),

      pull.collect(function(err, data){
        if(err)
          return callback(err)

        var flat = []
        data.forEach(function(d){
          flat = flat.concat(d)
        })

        callback(null, flat)
        
      })
    )
  }

  indexer.batch = function(batch, callback){
    this.expandBatch(batch, function(err, batch){
      if(err)
        return callback(err)

      db.batch(batch, function(err){
        callback(err, batch)
      })
    })
  }

  indexer.save = function save(key, value, callback){
    this.expandBatch([{
      type:'put',
      key:key,
      value:value
    }], function(err, batch){
      if(err)
        return callback(err)

      db.batch(batch, function(err){
        callback(err, batch)
      })
    })

    /*
    db.get(key, function(err, oldvalue){
      var batch = [{
        type:'put',
        key:key,
        value:value
      }]

      function emitter(type){
        return function emit(values, nopath){
          if(!nopath){
            values = (values || []).concat(key)
          }
          batch.push({
            type:type,
            key:(values || []).join('~'),
            value:0
          })
        }
      }
      
      if(oldvalue)
        mapper(key, oldvalue, emitter('del'))

      mapper(key, value, emitter('put'))

      db.batch(batch, function(err){
        callback(err, batch)
      })
    })
    */
  }

  return indexer;
}

