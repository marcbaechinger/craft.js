var util  = require('util'),
    spawn = require('child_process').spawn,
	PHANTOM_SCRIPT = "app/phantom-script.js",
	QUnitPhantomJS = function (spec) {
		this.exitCallback = spec.callback;
		this.url = spec.url;
	};

QUnitPhantomJS.prototype.run = function() {
	var process = spawn('phantomjs', [PHANTOM_SCRIPT, this.url]),
		buf = [],
		errBuf = [],
		that = this;
	
	process.stdout.on('data', function (data) {
		buf.push(data);
	});

	process.stderr.on('data', function (data) {
		errBuf.push(data);
	});

	process.on('exit', function (code) {
		if (that.exitCallback) {
			console.log("runned phantom js test", PHANTOM_SCRIPT, that.url);
			that.exitCallback(code, JSON.parse(buf.join("")), errBuf.length ? errBuf.join("") : undefined);
		}
	});
};

exports.QUnitPhantomJS = QUnitPhantomJS;