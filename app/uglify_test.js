#!/usr/local/bin/node

var uglify = require("./uglify");
	
uglify.process({
		src: "/Users/marcbaechinger/projects/node/quality-js/stuff/src/model/observable.js",
		strictSemicolon: false,
		transform: [
			{ task: "mangle" },
			{ task: "squeeze", options: {} }
		],
		generate: [
			{ name: "min" },
			{ name: "beauty",	options: { beautify: true }}
		]
	});
