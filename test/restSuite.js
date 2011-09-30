
this.restSuite = {
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
    'POST to /test1, payload': function (test) {

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
    'POST to /test1, payload, outgoing data validation': function (test) {

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

};
