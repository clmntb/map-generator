Context and Prerequisites
========================

Simple map generator for Google Maps Javascript API

You must have node.js, npm and bower installed as well as a mongodb database.

Install
=======

This should be enough to have everything up and running : 

```
$ git clone https://github.com/clmntb/map-generator
$ npm install 
$ cd public
$ bower install
```

Config
======

```
$ mv config.github.js config.js
```

* Edit the file to insert your Google Maps javascript API key
* Change the default settings (user, salt)
* Generate a sha256 hmac of the desired password and save it inside the config.js file.

Run
===

```
$ node index.js
```
