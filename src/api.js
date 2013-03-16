/*
 * This is the actual API endpoint that clients connect to
 */

var PORT = 3000;

/*
    /stream/contents/user
    /stream/contents/feed
    /stream/details
    /stream/items/ids
    /stream/items/count
    /stream/items/contents

    /subscription/edit
    /subscription/list
    /subscription/export
    /subscribed

    /token
    /user-info

    /unread-count
    /mark-all-as-read

    /tag/list
    /rename-tag
    /edit-tag
    /disable-tag
*/

var express = require('express'),
    crypto = require('crypto'),
    db = require('./db'),
    utils = require('./utils');
    
var app = express();
app.use(express.bodyParser());
app.use(express.cookieParser('gobbledygook'));
app.use(express.session({ key: 'SID' }));

// include routes
app.use(require('./api/user'));
app.use(require('./api/subscription'));
app.use(require('./api/stream'));
app.use(require('./api/tag'));

app.listen(PORT);
console.log('Started server on port ' + PORT);