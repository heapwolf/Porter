
# Deeds.js
Deeds is a very simple client side Data Access Layer. An abstraction meant to reduce the boiler plate code associated with making ajax calls. Currently this uses jQuery to make ajax requests. There are plans to remove the dependency eventually, as well as make node.js module-capable.

### How Does it work?
Here is a very trivial example. An application defines several calls to the Middle-end which are grouped by the HTTP verb that they will use.

    var deed = new deeds({
      
      get: {
        users: '/api/users/:partialname',
        apps: '/api/apps/'
      },
      
      post: {
        users: '/api/users'
      }
      
    });

The deeds constructor takes a single object literal that contains paths grouped by the HTTP verb that they will use. The paths can have tokens in them that get supplanted when called. Here is our above definition put to use...

    deed.get.users(

      { partialname: 'johnny' },

      function(error, response) {
        console.log(error || response);
      }

    );

### A more complex example...

    var deed = new deeds({
      
      get: { // optional
        users: '/api/users/:partialname',

        apps: '/api/apps/:partialname',
        appsBy: '/api/apps/:username',

        servers: '/api/servers',
        auth: '/api'
      },
      
      post: { // optional
        users: '/api/users'
      },
      
      delete: { // optional
        users: '/api/users/:username'
      }

    }).use({
      port: 8080, // optional 
      headers: { 'Accept': 'application/json' } // optional
    });

The deeds constructer returns itself, so the `use` function can be chained to it. The `use` function sets the defaults for all calls that get made. It accepts an object literal containing the following members...

`port` {number} - The port of the server that will accept the requests.
`host` {string} - An IP address of the host server that will accept the requests.
`headers` {object} - An object literal of HTTP request headers that will be attached to each request.
`protocol` {string} - The protocol to be used for all requests, ie 'http', 'https'.

### An example of the above code in use...

    deed.pot.users(

      { /*data*/ }, // optional

      function(xhr) { // optional
        xhr.setRequestHeader('authorization', 'Basic ' + encodeBase64('user:password'));
      },

      function(error, response) { // required
        console.log(error || response);
      }

    );
      
The above code demonstrates passing an object literal that supplants the values in the request url. It passes an object as the payload and dynamically sets the headers associated with this particular request.
      
# Licence

(The MIT License)

Copyright (c) 2010 hij1nx <http://www.twitter.com/hij1nx>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
