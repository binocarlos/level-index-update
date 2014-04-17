level-index-update
==================

![Build status](https://api.travis-ci.org/binocarlos/level-index-update.png)

A module to save a document into leveldb where the old indexes are removed in the same batch as the new ones are inserted

It is good for a document database where the values of a document will change.

This version loads the old document and creates a single batch of 'del' and 'put' commands from the mapper function you provide.

This should be done with an immutable append only collection but one step at a time : )

## example

```js
var level = require('level');
var sub = require('level-sublevel');
var indexupdate = require('level-index-update');

var db = sub(level(__dirname + '/pathdb', {
	 valueEncoding: 'json'
}))

var save = indexupdate(db.sublevel('docs'), '_indexes', function(key, value, emit){

	// you can emit multiple indexes per value
	emit(['color', value.color])
	emit(['heightcolor', value.height, value.color])

})

save('/my/path', {
	height:50,
	color:'red'
}, function(err, batch){

	console.dir(batch);
	// [{type:'put', key:'/my/path', value:'{color:"red",height:50}'},
	// {type:'put', key:'color~red~/my/path'},
	// {type:'put', key:'heightcolor~red~50~/my/path'}]

	// the index for red is inserted

	save('/my/path', {
		height:45,
		color:'blue'
	}, function(err, batch){

		console.dir(batch);
		// {type:'put', key:'/my/path', value:'{color:"blue",height:45}'},
		// {type:'del', key:'color~red~/my/path'},
		// {type:'del', key:'heightcolor~50~red~/my/path'},
		// {type:'put', key:'color~blue~/my/path'},
		// {type:'put', key:'heightcolor~45~blue~/my/path'}]

		// the index for red is deleted and the index for blue is inserted
	})
	
})
```

## api

### var updater = indexupdate(db, [indexpath], mapper)

Create an updater function by passing a leveldb, an optional path to write the indexes (defaults to 'updateindex') and a mapper function that will emit the index fields and values for each value

### updater(key, value, callback(err, batch))

Run the updater function by passing the key and the value for the update.

The callback will be passed the batch that was inserted into the database.

### mapper(key, value, emit([values]))

The mapper function is called for each update - once for the old values and once for the new values

call emit with an array of values to index based on the passed object

you can call emit many times per object - the key will be added to the index entry automatically

## todo

 * handle if a save request for a key arrives whilst another is resolving

## license

MIT