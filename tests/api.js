var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    request = require('request');
    
var SERVER = 'http://localhost:3000';
var API = SERVER + '/reader/api/0';
var SID;

QUnit.module('Auth');

QUnit.asyncTest('register account', function() {
    request.post(SERVER + '/accounts/register', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body, 'OK');
        
        QUnit.start();
    }).form({ Email: 'test@example.com', Passwd: 'test' });
});

QUnit.asyncTest('duplicate registration', function() {
    request.post(SERVER + '/accounts/register', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=DuplicateUser');
        
        QUnit.start();
    }).form({ Email: 'test@example.com', Passwd: 'test' });
});

QUnit.asyncTest('invalid registration', function() {
    request.post(SERVER + '/accounts/register', function(err, res, body) {
        assert.equal(res.statusCode, 400);
        assert.equal(body, 'Error=BadRequest');
        
        QUnit.start();
    }).form({ Passwd: 'test' });
});

QUnit.asyncTest('ClientLogin invalid username', function() {
    request.post(SERVER + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 403);
        assert.equal(body, 'Error=BadAuthentication');
        
        QUnit.start();
    }).form({ Email: 'invalid@example.com', Passwd: 'password' });
});

QUnit.asyncTest('ClientLogin invalid password', function() {
    request.post(SERVER + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 403);
        assert.equal(body, 'Error=BadAuthentication');
        
        QUnit.start();
    }).form({ Email: 'test@example.com', Passwd: 'invalid' });
});

QUnit.asyncTest('valid ClientLogin', function() {
    request.post(SERVER + '/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/SID=.+\n/.test(body));
        assert.ok(/LSID=.+\n/.test(body));
        assert.ok(/Auth=.+\n/.test(body));
        
        // store for later tests
        SID = body.match(/SID=(.+)\n/)[1];
        
        QUnit.start();
    }).form({ Email: 'test@example.com', Passwd: 'test' });
});

QUnit.asyncTest('token auth required', function() {
    request.get({ url: API + '/token', jar: false }, function(err, res, body) {
        assert.equal(res.statusCode, 401);
        assert.equal(body, 'Error=AuthRequired');
        
        QUnit.start();
    });
});

QUnit.asyncTest('token success', function() {
    request(API + '/token', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.equal(body.length, 24);
        
        QUnit.start();
    });
});

QUnit.asyncTest('user-info', function() {
    request(API + '/user-info', function(err, res, body) {
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
        
        QUnit.start();
    });
});