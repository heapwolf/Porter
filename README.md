![Alt text](https://github.com/hij1nx/Porter/raw/master/doc/logo.png)<br/>

### porter is a lightweight, resourced oriented, abstraction layer for JSON-REST. It will generate methods needed to access resources based on a JSON configuration. It will balance your code's signal to noise ratio by simplifying the communication interfaces.

```javascript
var porter = Porter({

  users: {
    list: ['get', '/api/users/:partialname'],
    update: ['post', '/api/apps/:username']
  },

  apps: {
    list: ['get', '/api/apps/:username'],
    create: ['post', '/api/apps/:username/:appname']
  }

});
```

The Porter constructor takes a single object literal containing members grouped by resource. Resources are then expressed as arrays. In the case of defining a REST call, there is a verb and a path, where each path can have tokens in it that will get supplanted when used. Here is the above definition put in use...

### Payload and Parameters

```javascript
porter.users.list(

  { partialname: 'bill' }, // replaces the ':partialname' token in the 'list' resource's URI.
  { foo: 10, bar: 20 }, // appends '?foobar=10&bar=20' to the URL when the method is a GET, adds as a message body for a POST.
  function(error, response) {
    // do something...
  }

);
```

The `list` function was generated from its definition in the `users` group. We pass it 1) an object literal that supplants the token in the request url and 2) a callback function that will process when the request is done.

### Adding inbound and outbound data validation, and more complex resource organization.

```javascript
function hasData(data) { // a simple data validator.
  if(typeof data !== 'undefined') {
    return true;
  }
}

var porter = Porter({

  admin: {
    users: {
      list: ['get', '/api/users/:partialname', { outbound: hasData, inbound: hasData }],
      update: ['post', '/api/apps/:username']
    },

    apps: {
      list: ['get', '/api/apps/:username'],
      create: ['post', '/api/apps/:username/:appname']
    }
  }
});
```
Any arbitrary function can be applied to assert the inbound and outbound data of a request, as seen above. If a validating function returns anything other than true, it is considered invalid and the callback for the resource will will have its 'error' parameter populated with either the exception or the return value of the validator.

### Specifying settings that apply to all calls that get made.

```javascript
var porter = Porter({

  users: {
    list: ['get', '/api/users/:partialname', { outbound: hasData, inbound: hasData }],
    update: ['post', '/api/apps/:username', { inbound: hasData }]
  },

  apps: {
    list: ['get', '/api/apps/:username', { inbound: hasData }],
    create: ['post', '/api/apps/:username/:appname', { inbound: hasData }]
  }

}).use({
  port: 8080,
  inbound: hasData,
  outbound: hasData,
  headers: { 'Accept': 'application/json' }
});
```

The `use` function sets the defaults for all calls that get made. It accepts an object literal containing the following members...

`port` Number - The port of the server that will accept the requests.<br/>
`inbound` Object - A JSONSchema object that will validate against every incoming request.<br/>
`outbound` Object - A JSONSchema object that will validate against every outgoing request.<br/>
`host` String - An IP address of the host server that will accept the requests.<br/>
`headers` Object - An object literal of HTTP request headers that will be attached to each request.<br/>
`protocol` String - The protocol to be used for all requests, ie 'http', 'https'.<br/>
`lib` Object - If you want to use a more full featured, cross-browser friendly ajax library ****add this back!****.<br/>

And here is the above code in use...

```javascript
porter.headers['Authorization'] = 'Basic ' + encodeBase64('username:password');

porter.users.update(
  
  { partialname: 'bill' },
  { address: '555 Mockingbird Ln' },
  
  function(error, response) {
    // do something...
  }
);
```

The `update` function was generated from its definition in the `users` group. We pass it a payload object, some data to replace the url tokens with and a callback function for when the request has finished processing. The app object will also expose the headers collection, this is simply an object literal that contains the headers to be used for the request.

### Specifying what to do with the response.

```javascript
var porter = Porter({

  users: {
    list: ['get', '/api/users/:partialname']
  }

}).use({
  port: 8080,
  host: 'google.com'
}).on({
  '500': function(err, response) {
    // do something...
  },
  '404': function(err, response) {
    // do something...
  }
});
```

In a lot of cases you'll want to handle http responses based on their response code. using the `on` method will allow you to associate methods with these response codes. In some cases you'll want to explicitly override these http response code handlers. you can do this by replacing the regular callback method with an object literal containing the items to overwrite.

```javascript
porter.users.update(
  
  { partialname: 'bill' },
  { address: '555 Mockingbird Ln' },
  
  {
    '404': function(err, response) {
      // do something...
    },
    '500': function(err, response) {
      // do something...
    }
  }
);
```


### Testing and debugging.

Porter provides a simple Node.js server to complement it's test suite. You may find this a useful starting point for your own test suite.
![Alt text](https://github.com/hij1nx/Porter/raw/master/doc/test.png)<br/>


## Credits

Author: hij1nx

Contributors: indexzero, marak

## Licence

(The MIT License)

Copyright (c) 2011 hij1nx <http://www.twitter.com/hij1nx>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
