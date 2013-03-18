## What is this?

Google reader is shutting down.  A lot of people use it.  A lot of apps depend on its API.
This project will be an attempt to create an API compatible replacement so those apps will 
continue to work by simply changing the API end point.  I have no plans to build a frontend UI 
replacement, just the backend API.  Once we have the Google Reader API working, we may be able
to add extensions to it so that apps can add additional features that weren't previously possible.

## Tech

* [Node.js](http://nodejs.org/)
* [MongoDB](http://www.mongodb.org) (so I can try something new!)
* [Express](http://expressjs.com/)
* [Mongoose](http://mongoosejs.com/)

Some interesting modules to investigate:

* https://github.com/danmactough/node-feedparser
* https://github.com/dylang/node-rss

Some unofficial API documentation on the old Google Reader API that we'd be copying

* http://undoc.in
* http://ranchero.com/downloads/GoogleReaderAPI-2009.pdf
* http://code.google.com/p/pyrfeed/wiki/GoogleReaderAPI
* https://developers.google.com/accounts/docs/AuthForInstalledApps

Some documentation on the dirtier side of RSS/Atom feeds:
https://docs.google.com/document/d/1cvq67iQpk2C7ufOsefsfKnGCXeUIv46NQHbnHkm8PtU/edit?usp=sharing

A mailing list discussing the future of RSS syncing:
http://lists.ranchero.com/listinfo.cgi/rss-sync-ranchero.com

## Want to help?

Get in touch on [Twitter](http://twitter.com/devongovett) or IRC (#reader on Freenode) 
and let me know! :) Feel free to fork this repository and send pull requests implementing features.  Once you've sent a couple good ones, I'll add you as a contributor to the project to commit directly.

Things to work on:

* Feed fetching and storing
* API endpoints
* Testing
* etc. We are young!

Check out the [issues](https://github.com/devongovett/reader/issues) for more details.  If you're
working on something, please mark it so we don't duplicate effort.

## Installation

1. [Install MongoDB](http://docs.mongodb.org/manual/installation/) if you haven't already.
2. [Install Node.js](http://nodejs.org/) if you haven't already.
3. Clone this repo using Git
4. Run `npm install` to install the dependencies

Run the API server with:

    npm start
    
Or run the tests with:

    npm test

## License

MIT