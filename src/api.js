/*
 * This is the actual API endpoint that clients connect to
 */

var express = require('express'),
    db = require('./db'),
    utils = require('./utils');
    
var app = module.exports = express();
app.use(express.bodyParser());
app.use(require('./session'));

// loads the currently logged in user into req.user
app.use(function(req, res, next) {
    if (!req.session || !req.session.user)
        return next();
        
    db.User.findById(req.session.user, function(err, user) {
        req.user = user;
        res.set('X-Reader-User', req.user.id);
        next();
    });
});

// configuration
app.configure('development', function() {
    app.set('db', 'reader');
    app.set('port', 3000);
});

app.configure('testing', function() {
    app.set('db', 'reader_test');
    app.set('port', 3456);
});

db.connect(app.get('db'));

// include routes
app.use(require('./api/user'));
app.use(require('./api/subscription'));
app.use(require('./api/stream'));
app.use(require('./api/tag'));
app.use(require('./api/preference'));

app.listen(app.get('port'));
console.log('Started server on port ' + app.get('port'));