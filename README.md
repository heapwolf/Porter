
# deeds.js
deeds is a very easy to use, portable Data Access Layer. An abstraction meant to reduce the boiler plate code associated with making ajax calls. deeds does not use any 3rd party ajax libraries to run in the client, but can. ***NOT RUNNING IN NODE RIGHT NOW***

### An example...
Here is a very trivial example where we define two GETs and a POST.

    var deed = new deeds({
      
      get: {
        users: '/api/users/:partialname',
        apps: '/api/apps/'
      },
      
      post: {
        users: '/api/users'
      }
      
    });

The deeds constructor takes a single object literal containing paths grouped by the HTTP verb that they will use. The paths can have tokens in them that get supplanted when called. Here is our above definition put to use...

    deed.get.users(

      { partialname: 'johnny' },

      function(error, response) {
        console.log(error || response);
      }

    );

The `users` function was generated from its definition in the `get` group. We pass it 1) an object literal that supplants the values in the request url and 2) a callback function that will process when the request is done.

### A more complex example...

    var deed = new deeds({
      
      get: {
        users: '/api/users/:partialname',

        apps: '/api/apps/:partialname',
        appsBy: '/api/apps/:username',

        servers: '/api/servers',
        auth: '/api'
      },
      
      post: {
        users: '/api/users'
      },
      
      delete: {
        users: '/api/users/:username'
      }

    }).use({
      port: 8080,
      headers: { 'Accept': 'application/json' }
    });

The deeds constructer returns itself, so the `use` function can be chained to it. The `use` function sets the defaults for all calls that get made. It accepts an object literal containing the following members...

`port` Number - The port of the server that will accept the requests.<br/>
`host` String - An IP address of the host server that will accept the requests.<br/>
`headers` Object - An object literal of HTTP request headers that will be attached to each request.<br/>
`protocol` String - The protocol to be used for all requests, ie 'http', 'https'.<br/>
`lib` Object - If you want to use a more full featured, cross-browser friendly ajax library.<br/>

And here is the above code in use...

    deed.post.users(

      { foo: 'data' },

      function(xhr) {
        xhr.setRequestHeader('authorization', 'Basic ' + encodeBase64('username:password'));
      },

      function(error, response) {
        
        console.log(error || response);
      }

    );

The `users` function was generated from its definition in the `post` group. We pass it 1) a payload object, 2) a function to dynamically set the headers associated with this particular request, and 3) a callback function for when the request has finished processing.
      
# Licence

(The MIT License)

Copyright (c) 2010 hij1nx <http://www.twitter.com/hij1nx>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
