## What is this?

Google reader is shutting down.  A lot of people use it.  A lot of apps depend on its API.
This project will be an attempt to create an API compatible replacement so those apps will 
continue to work by simply changing the API end point.  I have no plans to build a frontend UI 
replacement, just the backend API.  Once we have the Google Reader API working, we may be able
to add extensions to it so that apps can add additional features that weren't previously possible.

## Want to help?

Get in touch on [Twitter](http://twitter.com/devongovett) or IRC (#reader on Freenode) 
and let me know! :) Feel free to fork this repository and send pull requests implementing features.  Once you've sent a couple good ones, I'll add you as a contributor to the project to commit directly.

Things to work on:

* API endpoints - almost complete, only a few remaining unimplemented APIs and a few TODOs in the code.
  See a list of what's done and what needs work [here](https://github.com/devongovett/reader/issues/5).
* Testing - we could always use more of it
* Feed fetching and storing - this is the major project to work on. It somewhat kind of works at this point, 
  and it needs to be rock solid and battle tested with lots of real world feeds and situations, some of which are listed 
  [here](https://docs.google.com/document/d/1cvq67iQpk2C7ufOsefsfKnGCXeUIv46NQHbnHkm8PtU/edit?usp=sharing).  The bug for discussion
  is [here](https://github.com/devongovett/reader/issues/4).
* etc. We are young!  See the [issues](https://github.com/devongovett/reader/issues) page for more info.

Check out the [issues](https://github.com/devongovett/reader/issues) for more details.  If you're
working on something, please mark it so we don't duplicate effort.

## Design Documentation

If you're interested in contributing and don't quite know where to begin, you should read the [design documentation](https://github.com/devongovett/reader/wiki/Design-Documentation) on the wiki which explains the overall archetecture of the project.  If you think something is missing from that page, don't hesitate to file an issue or hop in the #reader IRC channel on Freenode to ask questions!

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
* http://code.google.com/p/google-reader-api/w/list
* https://developers.google.com/accounts/docs/AuthForInstalledApps
* https://github.com/alexch/sharebro/blob/master/notes/google-reader-api.txt

Some documentation on the dirtier side of RSS/Atom feeds:
https://docs.google.com/document/d/1cvq67iQpk2C7ufOsefsfKnGCXeUIv46NQHbnHkm8PtU/edit?usp=sharing

A mailing list discussing the future of RSS syncing:
http://lists.ranchero.com/listinfo.cgi/rss-sync-ranchero.com

## Installation

1. [Install MongoDB](http://docs.mongodb.org/manual/installation/) if you haven't already.
2. [Install Node.js](http://nodejs.org/) if you haven't already.
3. [Install Redis](http://redis.io/) if you haven't already.
4. Clone this repo using Git
5. Run `npm install` to install the dependencies

Run the API server with:

    npm start
    
Or run the tests with:

    npm test

## License

MIT
