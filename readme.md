# craft.js - javascript build tool

See http://marc.no.de for a live demo.

## Installation 

```
 # get craft.js from github
git clone git@github.com:marcbaechinger/craft.js.git

cd craft.js/
 # install dependencies
npm install

 # create source repository and dist directory (names must match for v0.0.1) 
mkdir stuff stuffdist
 # put sample JavaScript files into repository directory 
echo "var i = 0;" > stuff/sample.js

 # start application
node server.js

```

## Usage

- Navigate your Browser to [http://localhost:3000/build/](http://localhost:3000/build/) to browse the JavaScript in the `stuff` directory (see installation instructions).
- Browse to a JavaScript of your choice.
- Show JavaScript and play with the `expand`, `mangle`, `squeeze`, `minimize`, `beautify` and `lint` options. The transformed JavaScript file is doisplayed accordingly.
- Use the `text/javascript` option to have the file delivered with content type `text/javascript`.
	
![JavaScript source code viewer](/marcbaechinger/craft.js/raw/master/screenshot.jpg)