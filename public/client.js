// client-side js
// run by the browser each time your view template is loaded

//initial page load, get array of data from server to populate <ul> with <li>
fetch('/dreams')
  .then(response => response.json() ) //.json() reads stream to completion, returns a promise that resolves with the result of parsing the body text as JSON. more options: https://developer.mozilla.org/en-US/docs/Web/API/Response
  .catch(error => console.error(error) ) //catch errors
  .then( data=> { //promise resolves here, the json encoded string body text was parsed and is now a js value
    // console.log(data) //server sent an array, log it if needed
    data.forEach( dream=> {
      const li = document.createElement('li')
      li.textContent = dream
      // console.dir(li)
      document.querySelector('#dreams').appendChild(li)
    } )
  } )

document.querySelector('#myForm').addEventListener( 'submit', (event)=>{
  //stop default behaviour of submission, which will lead to refresh
  event.preventDefault()
  //make elem, append, cleanup, focus
  const li = document.createElement('li')
  li.textContent = document.querySelector('#todo').value
  document.querySelector('#dreams').appendChild(li)
  document.querySelector('#todo').focus()
  //post to server: a json encoded string to be parsed with body-parser, or formdata which requires middleware like multer
  // fetch('dreams', { method:'POST', body:new FormData( document.querySelector('#myForm') ) } ) //only if handling multipart/form-data content type
  fetch('dreams', { method:'POST', headers: {"Content-Type": "application/json"}, body: JSON.stringify(
    {
      todo:document.querySelector('#todo').value,
      food:document.querySelector('#food').value
    } ) }
  )
    .then(response => response.text() ) //.text reads stream to completion, then returns a promise that resolves the body text to a string
    .catch(error => console.error('Error:', error) ) //error handling
    .then(data => {
      console.log('server response: ', data) 
      document.querySelector('#todo').value = '' //for many fields, use querySelectorAll, but with a callback
      document.querySelector('#food').value = ''
    })
})