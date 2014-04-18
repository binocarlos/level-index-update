level-index-update
==================

![Build status](https://api.travis-ci.org/binocarlos/level-index-update.png)

A module to save a document into leveldb where the old indexes are removed in the same batch as the new ones are inserted

It loads the old document and creates a single batch of 'del' and 'put' commands from the mapper function you provide.

It can also expand a batch of multiple documents into a single larger batch containing the index 'put' and 'del' commands for each document.

This is a cumbersome way to do it and there are limitations but hey - life is short and suggestions (like how to manage an immutable collection of indexes for changing values) are welcome : )

## example

```js
var level = require('level');
var sub = require('level-sublevel');
var indexupdate = require('level-index-update');

var db = sub(level(__dirname + '/pathdb', {
	 valueEncoding: 'json'
}))

var indexer = indexupdate(db.sublevel('docs'), '_indexes', function(key, value, emit){

	// you can emit multiple indexes per value
	emit(['color', value.color])
	emit(['heightcolor', value.height, value.color])

})

indexer.save('/my/path', {
	height:50,
	color:'red'
}, function(err, batch){

	console.dir(batch);
	// [{type:'put', key:'/my/path', value:'{color:"red",height:50}'},
	// {type:'put', key:'color~red~/my/path'},
	// {type:'put', key:'heightcolor~red~50~/my/path'}]

	// the index for red is inserted

	indexer.save('/my/path', {
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

You can also insert a batch of documents and it will auto-expand the batch for the indexes:

```js
indexer.batch([{
	key:'/my/path',
	color:'red',
	height:50
},{
	key:'/my/otherpath',
	color:'blue',
	height:45
}], function(err, batch){
	console.dir(batch);

	// [{type:'put', key:'/my/path', value:'{color:"blue",height:45}'},
	// {type:'put', key:'color~red~/my/path'},
	// {type:'put', key:'heightcolor~50~red~/my/path'},
	// {type:'put', key:'/my/otherpath', value:'{color:"blue",height:45}'},
	// {type:'put', key:'color~blue~/my/otherpath'},
	// {type:'put', key:'heightcolor~45~blue~/my/otherpath'}],

})

```

## api

### var indexer = indexupdate(db, [indexpath], mapper)

Create an updater function by passing a leveldb, an optional path to write the indexes (defaults to 'updateindex') and a mapper function that will emit the index fields and values for each value

### indexer.save(key, value, callback(err, batch))

Run the updater function by passing the key and the value for the update.

The callback will be passed the batch that was inserted into the database.

### indexer.expandBatch(arr, callback(err, batch))

Pass a batch of commands and it will convert into a larger batch with all the indexes for each 'put' and 'del' resolved.

### indexer.batch(arr, callback(err, batch))

Uses expandBatch and then actually runs the batch

### mapper(key, value, emit([values], manualkey))

The mapper function is called for each update - once for the old values and once for the new values

Call emit with an array of values to index based on the passed object

You can call emit many times per object - the key will be added to the index entry automatically

Pass an array of values to the indexer - the key will automatically be appended.

If you want to manually manage the index but still want the batch behavious, pass true as the second argument to emit:

```js

var indexer = indexupdate(db.sublevel('docs'), '_indexes', function(key, value, emit){

	// manually manage the index structure
	emit(['color', value.color, key, '__', new Date().getTime()], true)

})
```

## todo

 * handle if a save request for a key arrives whilst another is resolving

## license

MIT