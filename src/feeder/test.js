var feeder = require('./feeder');

feeder.subscribe('http://rss.badassjs.com/')
    .on('meta', console.log)
    .on('post', console.log)
    .on('update', console.log);