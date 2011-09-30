var restSuite = this.restSuite = {};
!function() {
  mock('GET to /test1');
  mock('PUT to /test1 with payload');
  mock('PUT to /test1 with payload and with validation');
  mock('GET to /test2');
  mock('POST to /test2/:id with url token replacement and with payload');
  mock('POST to /test2/:id/:name with url token replacement and with payload');
  mock('GET to /deep/url');
  mock('GET to /404 with status handlers', function(test) {
    return {
      '404': emptyResponse(test)
    };
  });
  mock('GET to /404 with default status handler', function(test) {
    return {
      '200': function() {},
      'default': emptyResponse(test)
    };
  });
  mock('GET to /403 with global handler', function(test) {
    io.on({
      '403': emptyResponse(test)
    });
    return {};
  });
  mock('GET to /402 with global and local handler', function(test) {
    io.on({
      '402': emptyResponse(test)
    });
    return {
      '402': emptyResponse(test, false)
    };
  });
  mock('GET to /401 with global and local handler stopping propagation',
       function(test) {
    io.on({
      '401': unexpectedResponse(test)
    });
    return {
      '401': propagatedResponse(test)
    };
  });


  // Internal
  function mock(text, callback) {
    var match = /(GET|POST|PUT|DELETE) to ([^\s]+)/.exec(text);
    if (match === null) return;

    var method = match[1].toLowerCase(),
        url = match[2],
        validation = /with validation/i.test(text);

    function search(conf, match) {
      var result = false;

      if (Array.isArray(conf)) {
        if (conf[0] === method && conf[1] === url &&
            conf.length === (validation ? 3 : 2)) {
          result = match;
        }
      } else {
        Object.keys(conf).some(function (key) {
          return result = search(conf[key], match.concat(key));
        });
      }

      return result;
    };

    var selector = search(PorterConfig, []),
        args = [];
    if (!selector || selector.length <= 0) return;

    if (/with url token replacement/i.test(text)) {
      args.push({
        id: 1,
        name: 'hij1nx'
      });
    }

    if (/with payload/i.test(text)) {
      args.push({
        value: 1
      });
    }

    function call(callback) {
      var fn = selector.slice(0, -1).reduce(function(acc, curr) {
        return acc[curr];
      }, io);

      return fn[selector.slice(-1)].apply(fn, args.concat(callback));
    };

    restSuite[text] = function(test) {
      call(callback ? callback(test) : function(err, response) {
        if (validation) {
          if (/should fail/i.test(text)) {
            test.ok(err);
          } else {
            test.ok(!err);
          }
        }
        test.ok(response, 'received data from test server');
        test.done();
      });
    };
  }
  
  function emptyResponse(test, finish) {
    return function(err, response) {
      test.equal(err, null);
      test.equal(response, '');

      if (finish !== false) {
        test.done();
      }
    };
  };

  function propagatedResponse(test) {
    return function(err, response) {
      test.equal(err, null);
      test.equal(response, '');

      setTimeout(function() {
        test.done();
      }, 10);

      return false;
    };
  };

  function unexpectedResponse(test) {
    return function(err, response) {
      test.ok(false, 'Unexpected that handler\'s call');
    };
  };
;
}();

/*
    'POST to /test1, no payload': function (test) {

      io.groupA.resourceA(
        function(err, response) {
          test.ok(response, 'received data \'{data: "ok"}\' from test server ' + response);
          test.done();
        }
      );

    },
    'POST to /test1, no payload, url token replacement': function (test) {

      io.groupA.resourceA(
        {
          id: 10
        },
        function(err, response) {
          test.ok(response, 'received data \'{data: "ok"}\' from test server ' + response);
          test.done();
        }
      );

    },
    'PUT to /test1, payload': function (test) {

      io.groupA.resourceB(
        {
          value: 10
        },
        function(err, response) {
          test.ok(response, 'received data \'{data: "ok"}\' from test server ' + response);
          test.done();
        }
      );

    },
    'PUT to /test1, payload, outgoing data validation': function (test) {

      io.groupA.resourceC(
        {
          value: 10
        },
        function(err, response) {
          test.ok(!err, 'the outgoing data is valid');
          test.ok(response, 'received data \'{data: "ok"}\' from test server ' + response);
          test.done();
        }
      );

    },
    'POST to /test1, payload, incoming data validation': function (test) {

      io.groupA.resourceC(
        {
          value: 10
        },
        function(err, response) {
          test.ok(!err, 'the incoming data is valid');
          test.ok(response, 'received data \'{data: "ok"}\' from test server ' + response);
          test.done();
        }
      );

    },
    'POST to unittests/test1, payload, url token replacement': function (test) {
      setTimeout(function () {
        // lots of assertions
        test.ok(true, 'everythings ok');
        test.done();
      }, 10);
    },


    'GET from unittests/test1, no params': function (test) {
      setTimeout(function () {
        // lots of assertions
        test.ok(true, 'everythings ok');
        test.done();
      }, 10);
    },
    'GET from unittests/test1, no params, url token replacement': function (test) {
      setTimeout(function () {
        // lots of assertions
        test.ok(true, 'everythings ok');
        test.done();
      }, 10);
    },
    'GET from unittests/test1, params': function (test) {
      setTimeout(function () {
        // lots of assertions
        test.ok(true, 'everythings ok');
        test.done();
      }, 10);
    },
    'GET from unittests/test1, params, url token replacement': function (test) {
      setTimeout(function () {
        // lots of assertions
        test.ok(true, 'everythings ok');
        test.done();
      }, 10);
    }

};*/
