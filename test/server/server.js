
require.paths.unshift(require('path').join('..'));

var sys = require('sys'),
    fs = require('fs'),
    qs = require('querystring'),
    eyes = require('eyes'),
    colors = require('colors'),
    http = require('http'),
    url = require('url'),
    nstatic = require('node-static');

var files = new nstatic.Server(__dirname + '/../../'),
    server = http.createServer(function (request, response) {

      if (request.url.match(/^\/(test1|test2|deep\/url)/)) {
        response.end('{ data: "ok" }');
      }
      else if (request.url.match(/^\/\d+/)) {
        response.writeHead(+request.url.match(/\d+/)[0]);
        response.end('');
      }
      else {

        request
          .addListener('end', function () {
            console.log('['.grey+'served'.yellow+'] '.grey + request.url.grey);
            files.serve(request, response);
          });
      }
    });

try {

  server.listen(8080);
  console.log('Porter test server strted on http://127.0.0.1:8080 - Node.js ' + process.version.red);
  console.log('Use http://127.0.0.1:8080/test/test.html');

}
catch(ex) {

  console.log('Could not start the test server. ' + ex.message);
  return;
}

