
this.restSuite = {
    'POST to ': function (test) {
        setTimeout(function () {
            // lots of assertions
            test.ok(true, 'everythings ok');
            test.ok(true, 'everythings ok');
            test.ok(true, 'everythings ok');
            test.ok(true, 'everythings ok');
            test.ok(true, 'everythings ok');
            test.done();
        }, 10);
    }
};
