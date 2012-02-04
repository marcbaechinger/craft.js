# craft.js - javascript build tool

See http://marc.no.de for a live demo.

![JavaScript source code viewer](/marcbaechinger/craft.js/raw/master/screenshot.jpg)

craft.js helps to manage, assess, build and distribute from a common JavaScript source code base.

## Installation 

```
 # get craft.js from github
git clone git@github.com:marcbaechinger/craft.js.git

 # install dependencies
cd craft.js/ && npm install

 # start application
node server.js

```

## Usage

- Navigate your Browser to [http://localhost:3000/build/](http://localhost:3000/build/) to browse the JavaScript in the `stuff` directory (see installation instructions).
- Browse to a JavaScript of your choice.
- Show JavaScript and play with the `expand`, `mangle`, `squeeze`, `minimize`, `beautify` and `lint` options. The transformed JavaScript file is displayed accordingly.
- Use the `text/javascript` option to have the file delivered with content type `text/javascript`.

## Resolving script dependencies

Declare dependencies of a script at the top of a JavaScript file:

```
//= require "../../model/collection"
```

- choose the `expand` option to let craft.js resolve direct and transitive dependencies automatically

## Configuration

Change the `app-config.js` to adjust the `port` on which the appication should listen.

```
exports.server = {
	port: 3000
};
exports.context = {
	src: "repo",  // context of src directory -> localhost:3000/repo/sample.js
	dist: "dist"  // context of distribution directory -> localhost:3000/dist/craftjs_20120204-205351_450.js
};
exports.path = {
	src: __dirname + "/resources",
	dist: __dirname + "/dist",
	views: __dirname + "/views",
	docroot: __dirname + '/public'
};
```