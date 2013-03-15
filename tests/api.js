var QUnit = require('qunit-cli'),
    assert = QUnit.assert,
    request = require('request');
    
QUnit.module('Auth');

QUnit.asyncTest('valid ClientLogin', function() {
    request.post('http://localhost:3000/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 200);
        assert.ok(/SID=.+\n/.test(body));
        assert.ok(/LSID=.+\n/.test(body));
        assert.ok(/Auth=.+\n/.test(body));
        
        QUnit.start();
    }).form({ Email: 'test@example.com', Passwd: 'test' });
});

QUnit.asyncTest('ClientLogin invalid username', function() {
    request.post('http://localhost:3000/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 403);
        assert.equal(body, 'Error=BadAuthentication');
        
        QUnit.start();
    }).form({ Email: 'invalid@example.com', Passwd: 'password' });
});

QUnit.asyncTest('ClientLogin invalid password', function() {
    request.post('http://localhost:3000/accounts/ClientLogin', function(err, res, body) {
        assert.equal(res.statusCode, 403);
        assert.equal(body, 'Error=BadAuthentication');
        
        QUnit.start();
    }).form({ Email: 'test@example.com', Passwd: 'invalid' });
});