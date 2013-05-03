var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    xml = require('libxmljs'),
    shared = require('../shared'),
    request = shared.request;

QUnit.module('Auth');

QUnit.asyncTest('register account', function() {
    request.post(shared.server + '/accounts/register', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        
        QUnit.start();
    }).form({ Email: 'test@example.com', Passwd: 'test' });
});

QUnit.asyncTest('duplicate registration', function() {
    request.post(shared.server + '/accounts/register', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=DuplicateUser');
        
        QUnit.start();
    }).form({ Email: 'test@example.com', Passwd: 'test' });
});

QUnit.asyncTest('missing registration email', function() {
    request.post(shared.server + '/accounts/register', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=BadRequest');
        
        QUnit.start();
    }).form({ Passwd: 'test' });
});

QUnit.asyncTest('invalid registration email', function() {
    request.post(shared.server + '/accounts/register', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=BadRequest');
        
        QUnit.start();
    }).form({ Email: 'invalid', Passwd: 'test' });
});

QUnit.asyncTest('missing registration password', function() {
    request.post(shared.server + '/accounts/register', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=BadRequest');
        
        QUnit.start();
    }).form({ Email: 'test@example.com' });
});

QUnit.asyncTest('empty registration password', function() {
    request.post(shared.server + '/accounts/register', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=BadRequest');
        
        QUnit.start();
    }).form({ Email: 'test@example.com', Passwd: '' });
});

QUnit.asyncTest('ClientLogin invalid username', function() {
    request.post(shared.server + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 403);
        assert.equal(body, 'Error=BadAuthentication\n');
        
        QUnit.start();
    }).form({ Email: 'invalid@example.com', Passwd: 'password' });
});

QUnit.asyncTest('ClientLogin invalid password', function() {
    request.post(shared.server + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 403);
        assert.equal(body, 'Error=BadAuthentication\n');
        
        QUnit.start();
    }).form({ Email: 'test@example.com', Passwd: 'invalid' });
});

QUnit.asyncTest('ClientLogin missing password', function() {
    request.post(shared.server + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 403);
        assert.equal(body, 'Error=BadAuthentication\n');
        
        QUnit.start();
    }).form({ Email: 'test@example.com' });
});

QUnit.asyncTest('ClientLogin missing email', function() {
    request.post(shared.server + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 403);
        assert.equal(body, 'Error=BadAuthentication\n');
        
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
    }).form({ Email: 'test@example.com', Passwd: 'test' });
});

QUnit.asyncTest('token auth required', function() {
    request(shared.api + '/token', { headers: {}}, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        assert.equal(body, 'Error=AuthRequired');
        QUnit.start();
    });
});

QUnit.asyncTest('token invalid auth', function() {
    request(shared.api + '/token', { headers: { Authorization: 'GoogleLogin invalid' }}, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        assert.equal(body, 'Error=AuthRequired');
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
        assert.ok(/json/.test(res.headers['content-type']));
        
        body = JSON.parse(body);
        assert.equal(typeof body.userId, 'string');
        assert.equal(body.userName, 'test');
        assert.equal(body.userProfileId, body.userId);
        assert.equal(body.userEmail, 'test@example.com');
        assert.equal(body.isBloggerUser, false);
        assert.equal(typeof body.signupTimeSec, 'number');
        assert.equal(body.isMultiLoginEnabled, false);
        
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
        assert.equal(doc.get('./string[@name="userName"]').text(), 'test');
        assert.equal(doc.get('./string[@name="userProfileId"]').text(), userId);
        assert.equal(doc.get('./string[@name="userEmail"]').text(), 'test@example.com');
        assert.equal(doc.get('./boolean[@name="isBloggerUser"]').text(), 'false');
        assert.ok(/^\d+$/.test(doc.get('./number[@name="signupTimeSec"]').text()));
        assert.equal(doc.get('./boolean[@name="isMultiLoginEnabled"]').text(), 'false');
        
        QUnit.start();
    });
});

QUnit.asyncTest('user-info invalid format', function() {
    request(shared.api + '/user-info?output=invalid', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Invalid output format');
        QUnit.start();
    });
});