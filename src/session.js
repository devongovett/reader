// Custom session implementation using Google's Authorization: GoogleLogin
// header instead of cookies.
// See http://code.google.com/p/google-reader-api/wiki/Authentication

var crypto = require('crypto'),
    pause = require('pause'),
    redis = require('redis');
    
var client = redis.createClient();

// Google ClientLogin tokens expire after two weeks
// http://stackoverflow.com/questions/5853435/does-the-google-reader-api-token-expire/5853699#5853699
var EXPIRATION_TIME = 2 * 7 * 24 * 60 * 60; // in seconds for redis

module.exports = function(req, res, next) {
    var session, sessionID;
    
    getSession(req, function(err, data) {
        session = data;
        sessionID = session && session.id;
        next(err);
    });
    
    Object.defineProperty(req, 'session', {
        get: function() {
            return session || null;
        },
        
        set: function(sess) {
            // generate session ID automatically
            if (!session) {
                var buf = crypto.randomBytes(24);
                sess.id = buf.toString('hex').slice(0, 24);
            }
            
            session = sess;
        }
    });
    
    var end = res.end;
    res.end = function(data, encoding) {
        res.end = end;
        setSession(req, sessionID, function(err) {
            res.end(data, encoding);
        });
    };
};

function getSession(req, callback) {
    var match = /^GoogleLogin auth=([0-9a-f]+)$/.exec(req.get('Authorization'));
    if (!match)
        return callback(null, null);
        
    var paused = pause(req);
    client.get('session:' + match[1], function(err, session) {
        if (!err && session) {
            try {
                session = JSON.parse(session.toString());
            } catch(error) {
                session = null;
                err = error;
            }
        }
        
        paused.resume();
        callback(err, session);
    });
}

function setSession(req, id, callback) {
    if (id && !req.session)
        client.del('session:' + id, callback);
    else if (req.session)
        client.setex('session:' + req.session.id, EXPIRATION_TIME, JSON.stringify(req.session), callback);
    else
        callback(null);
}