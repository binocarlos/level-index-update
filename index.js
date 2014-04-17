module.exports = UpdateIndex;

function UpdateIndex(db, indexDb, mapper) {

  if(arguments.length<=2){
    mapper = indexDb
    indexDb = null
  }
    
  if(!indexDb)
    indexDb = 'updateindex' //default to name of this module.

  if('string' === typeof indexDb)
    indexDb = db.sublevel(indexDb)

  return function save(key, value, callback){
    db.get(key, function(err, oldvalue){
      var batch = [{
        type:'put',
        key:key,
        value:value
      }]

      function emitter(type){
        return function emit(values){
          var indexKey = (values || []).concat(key).join('~')
          batch.push({
            type:type,
            key:indexKey,
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
  }
}

