# craft.js - javascript build tool

See <a href="http://ec2-23-20-159-125.compute-1.amazonaws.com/">a live demo</a>.

craft.js helps to manage, assess, build and distribute from a common JavaScript source code base.

## Installation 

```
 # get craft.js from github
git clone https://github.com/marcbaechinger/craft.js.git

 # install dependencies
cd craft.js/ && npm install

 # start application
node server.js

```

## Configuration

Change the `app-config.json` to adjust the `port` on which the appication should listen.

```
{
    "server": {
        "port": 3000
    },
    "path": {
        "base": "",
        "src": "resources/repository",
        "dist": "resources/dist",
        "jobs": "resources/jobs",
        "views": "views",
        "docroot": "public"
    },
    "context": {
        "src": "repo",
        "dist": "dist",
        "jobs": "jobs",
        "default": "repo"
    }
}
```


## declaring dependencies in a script

Declare dependencies of a script with a processing instruction at the top of a JavaScript file:

```
//= require "../../model/collection, ../../model/model"
//= require "/common/array"
//= require "ui-helper"
```

Multiple dependencies can be declared in a single processing instruction or with multiple instructions. craft.js takes care to concatenate the script in the declared order and avoids including the same file twice. The .js post fix must be omitted when declaring dependencies with a processing instruction. 


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
curl http://marc.no.de/repo/src/applications/craftjs/bootstrap.js?mangle=true&squeeze=true&minimize=true
```

*Query parameters*

- mangle: rename local variables to miminize script
- squeeze: minimize even more (see JSHint docu)
- minimize: transforme to minimized script
- beautify: transform to pretty-printed script   
- jsviewer: show js file in the web viewer (text/html not text/javascript)

