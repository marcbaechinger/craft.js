# craft.js - javascript build tool

See http://marc.no.de for a live demo.
![JavaScript source code viewer](/marcbaechinger/craft.js/raw/master/public/images/screenshots.jpg)

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


## declaring dependencies in a script

Declare dependencies of a script with a processing instruction at the top of a JavaScript file:

```
//= require "../../model/collection, ../../model/model"
//= require "ui-helper"
```

Multiple dependencies can be declared in a single processing instruction or with multiple instructions. craft.js takes care to concatenate the script in the declared order and avoids including the same file twice.


## Usage

### Browse repository

- Navigate your Browser to [http://localhost:3000/repo/](http://localhost:3000/repo/) to browse the JavaScript in the `resources` directory (see installation instructions).
- Browse to a JavaScript of your choice.
- Show JavaScript and play with the `expand`, `mangle`, `squeeze`, `minimize`, `beautify` and `lint` options. The transformed JavaScript file is displayed accordingly.

### Create a distribution

- Browse to a file
- Add teh file to the project by clicking 'add to project' on the top right of the page
- Repeat with as many files as you require for build
- Click the project name to change the name of the project (part of the dist file name)
- Click the project bar on the top to show current project configuration
- Click the 'build' button to create a build 
- The browser is redirected to the new file stored on the server side

### Delivering JavaScripts on the fly

Expanding repositories and transforming the resulting source code can be done on the fly and delivered with content type text/javascript. Hence it's easy to create a single 'bootstrap.js' declare the required dependencies with the 'require' processing instructions and load the file on the fly while development or for testing.
 
```
curl http://marc.no.de/repo/src/applications/craftjs/bootstrap.js?plain=true&mangle=true&squeeze=true&minimize=true
```

*Query parameters*

- plain: deliver raw script with content type text/javascript
- mangle: rename local variables to miminize script
- squeeze: minimize even more (see JSHint docu)
- minimize: transforme to minimized script
- beautify: transform to pretty-printed script   

The web applicaton of craft.js uses this technique to serve the JavaScript for its web user interface.
