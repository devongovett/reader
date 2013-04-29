var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    fs = require('fs'),
    xml = require('libxmljs'),
    shared = require('./shared'),
    request = shared.request;

QUnit.module('Auth');

QUnit.asyncTest('ClientLogin invalid username', function() {
    request.post(shared.server + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 403);
        // assert.equal(body, 'Error=BadAuthentication\n'); // sometimes returns CaptchaRequired instead...

        QUnit.start();
    }).form({ Email: 'invalid@example.com', Passwd: 'password' });
});

QUnit.asyncTest('ClientLogin invalid password', function() {
    request.post(shared.server + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 403);
        // assert.equal(body, 'Error=BadAuthentication\n');

        QUnit.start();
    }).form({ Email: 'test@example.com', Passwd: 'invalid' });
});

QUnit.asyncTest('ClientLogin missing password', function() {
    request.post(shared.server + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 403);
        // assert.equal(body, 'Error=BadAuthentication\n');

        QUnit.start();
    }).form({ Email: 'test@example.com' });
});

QUnit.asyncTest('ClientLogin missing email', function() {
    request.post(shared.server + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 403);
        // assert.equal(body, 'Error=BadAuthentication\n');

        QUnit.start();
    }).form({ Passwd: 'hi' });
});

QUnit.asyncTest('valid ClientLogin', function() {
    request.post(shared.server + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/SID=.+\n/.test(body));
        assert.ok(/LSID=.+\n/.test(body));
        assert.ok(/Auth=.+\n/.test(body));

        shared.setAuth(body.match(/Auth=(.+)/)[1]);
        QUnit.start();
    }).form({ Email: shared.username, Passwd: shared.password, service: 'reader' });
});

QUnit.asyncTest('token auth required', function() {
    request(shared.api + '/token', { headers: {}}, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        QUnit.start();
    });
});

QUnit.asyncTest('token invalid auth', function() {
    request(shared.api + '/token', { headers: { Authorization: 'GoogleLogin invalid' }}, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        QUnit.start();
    });
});

QUnit.asyncTest('token success', function() {
    request(shared.api + '/token', function(err, res, body) {
        shared.token = body; // save for later

        assert.equal(res.statusCode, 200);
        assert.equal(body.length, 24);

        QUnit.start();
    });
});

QUnit.asyncTest('user-info', function() {
    request(shared.api + '/user-info', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        // assert.ok(/json/.test(res.headers['content-type'])); // looks like Google Reader uses "text/javascript; charset=UTF-8"... should we test for this?

        body = JSON.parse(body);
        assert.equal(typeof body.userId, 'string');
        assert.equal(typeof body.userProfileId, 'string');
        assert.equal(body.userEmail, shared.username);
        assert.equal(typeof body.signupTimeSec, 'number');

        assert.equal(res.headers['x-reader-user'], body.userId);
        shared.userID = body.userId; // save for later

        QUnit.start();
    });
});

QUnit.asyncTest('user-info xml', function() {
    request(shared.api + '/user-info?output=xml', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/xml/.test(res.headers['content-type']));
        var doc = xml.parseXml(body);
        assert.equal(doc.root().name(), 'object');

        var userId = doc.get('./string[@name="userId"]').text();
        assert.equal(typeof userId, 'string');
        assert.ok(/^\d+$/.test(doc.get('./string[@name="userProfileId"]').text()));
        assert.equal(doc.get('./string[@name="userEmail"]').text(), shared.username);
        assert.ok(doc.get('./boolean[@name="isBloggerUser"]').text());
        assert.ok(/^\d+$/.test(doc.get('./number[@name="signupTimeSec"]').text()));
        assert.ok(doc.get('./boolean[@name="isMultiLoginEnabled"]').text());

        QUnit.start();
    });
});

QUnit.asyncTest('user-info invalid format', function() {
    request(shared.api + '/user-info?output=invalid', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        QUnit.start();
    });
});
