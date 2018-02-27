//other modules
require('dotenv').config()
const https = require("https")
const mongoClient = require('mongodb').MongoClient
const uri = `mongodb://${process.env.dbusername}:${process.env.dbpassword}@ds247698.mlab.com:47698/image_search_proj`
//express
const express = require('express')
const app = express()

//host public files
app.use(express.static('public'))

//pug template rendering setup
app.set('view engine', 'pug')
app.set('views', __dirname + '/views' )

//root endpoint
app.get('/', (request, response)=> {
  console.log('get request to /')
  //res.render accepts a template filename (like the pug file) and data called locals
  response.render('index')
})

//list old searches endpoint
//order of middleware functions is important, especially if some routes match same as others
app.get( /^\/recents$/, (request,response)=>{
  console.log('get request to /recents')
  mongoClient.connect(uri,(err,client)=>{
    // console.log('connected successfully to mLab server')
    //pick database, assign to a variable to use with command operations
    const db = client.db('image_search_proj')
    //pick a collection, do something with it
    db.collection('searches')
    .find( {}, { projection:{'_id':0, 'millis_since_epoch':0}, sort:{'millis_since_epoch':-1}, limit:10 } )
    .toArray((err, docsArr)=>{
      if (err) console.error(err)
      // console.log(docsArr)
      response.send(docsArr)
      client.close()
    })
    
  } )

} )

//main searching endpoint
app.get(/^\/([\w%]{1,200})$/, (request, response)=> {
  console.log('get request to /{searchterm}')
  // console.log( 'searchTerm: ', request.params[0] )
  // console.log( 'object from query', request.query )
  //make url for https get request from this server
  URL = `https://www.googleapis.com/customsearch/v1?q=${request.params[0]}&key=${process.env.apiKey}&cx=012215755029527568711:ul8gjhwhqka&searchType=image`
  if (request.query.offset) URL += `&start=${request.query.offset}`
  console.log('url for CSE', URL)

  // https.get('https://jsonplaceholder.typicode.com/posts/1', (res) => {
  https.get( URL, (res) => {
    // console.log('CSE get request response code: ', res.statusCode)
    // console.log('CSE response content type: ', res.headers['content-type'])
    //handle data stream
    res.setEncoding('utf8')
    let rawData = ''
    res.on('data', chunk => rawData += chunk )
    res.on('end', () => {
      // console.log('raw data: \n', rawData)
      const parsedData = JSON.parse(rawData)
      //handle errors from cse request
      if (res.statusCode !== 200) {
        console.log(parsedData)
        response.send(parsedData)
        return
      }

      //make response array
      let responseArray = []
      parsedData.items.forEach(item => {
        responseArray.push(
          {
            'image_url': item.link,
            'context_url': item.image.contextLink,
            'title': item.title,
            'width_&_height': `${item.image.width}-${item.image.height}`
          }
        )
      })
      response.send(responseArray)

      //send search term to mongodb
      //connect to the server and do stuff
      mongoClient.connect(uri,(err,client)=>{
        // console.log('connected successfully to mLab server')
        //pick database, assign to a variable to use with command operations
        const db = client.db('image_search_proj')
        //pick a collection, do something with it
        db.collection('searches')
        .insertMany( [
          {
            'search_term':request.params[0],
            'time': new Date().toISOString(),
            'millis_since_epoch': Date.now() //returns milliseconds since the unix epoch ( January 1, 1970 00:00:00 UTC )
          }
        ], (err,res)=>{
          if (err) console.error(err)
          console.log('inserted 1 document into searches collection')
          // console.log('operation result: ', res)
          client.close()
        })
        
      } )

    } )
  } )
  .on('error', e => console.error(`Got error: ${e.message}`) )

})

// listen for requests, no need to use glitch's hidden .env for the port number. set one yourself
var listener = app.listen( 5000, ()=> console.log('Your app is listening on port ' + listener.address().port) )
