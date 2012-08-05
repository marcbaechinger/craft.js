/*global window: false, phantom: false */
/*jslint node: true */
var page = require('webpage').create(),
	INTERVAL_MILLIS = 50,
	testUrl = phantom.args[0]; //"http://localhost:3000/repo/test/model/model.qunit";

var waitFor = function (testFx, onReady, timeOutMillis) {
    	var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3001, //< Default Max Timout is 3s
	        start = new Date().getTime(),
	        condition = false,
	        interval = setInterval(function () {
	            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
	                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
	            } else {
	                if(!condition) {
	                    console.log(JSON.stringify({ url: url, status: timeout, maxtimeOutMillis: maxtimeOutMillis }));
	                    phantom.exit(1);
	                } else {
						onReady(new Date().getTime() - start);
	                    clearInterval(interval); 
	                }
	            }
	        }, INTERVAL_MILLIS);
	},
	testReportBuilder = function () {
		var tests = [];
		$("#qunit-tests > li").each(function() {
			var item = $(this),
				asserts = [];

			item.find("ol li").each(function () {
				var assertItem = $(this);
				asserts.push({
					status: assertItem.attr("class"),
					msg: assertItem.find(".test-message").text()
				});
			});
			tests.push({
				name: item.find(".test-name").text(),
				failed: item.find(".failed").text(),
				passed: item.find(".passed").text(),
				asserts: asserts
			});
		});

	    return {
			passed: $(".result .passed").text(),
			total: $(".result .total").text(),
			failed: $(".result .failed").text(),
			title: document.title,
			tests: tests
		};
	};

var QUnitTestRun = function (url, callback) {
	this.url = url;
	this.callback = callback;
};
QUnitTestRun.prototype.run = function() {
	var page = new WebPage(),
		that = this;

	page.onConsoleMessage = function (msg) {
	    console.err(msg);
	};

	page.open(this.url, function (status){
	    if (status !== "success") {
	        console.log(JSON.stringify({
				url: that.url,
				state: status,
				msg: "page returned without state 'success'" 
			}));
	        that.callback({ exitCode: 1 });
	    } else {
	        waitFor(
				function () {
	            	return page.evaluate(function (){
		                var el = document.getElementById('qunit-testresult');
		                if (el && el.innerText.match('completed')) {
		                    return true;
		                }
		                return false;
		            });
		        }, 
				function (timeTaken) {
	            	var testState = page.evaluate(testReportBuilder);

					testState.timeTaken = timeTaken;
					testState.url = that.url;
					testState.timestamp = new Date();
					testState.exitCode = (parseInt(testState.failed, 10) > 0) ? 1 : 0;

		            that.callback(testState);
		        }
			);
	    }
	});
};

var runTest = function (url, remainingTestCount, callback) {
	new QUnitTestRun(url, function (testResult) {
		callback(testResult);
		if (remainingTestCount < 1) {
			phantom.exit(testResult.exitCode);	
		}
	}).run();
};

var test;
if (testUrl.match(/\.qunit$/)) {
	runTest(testUrl, 0, function (report) {
		console.log(JSON.stringify(report, null, 2));
	});
} else if (testUrl.match(/\.suite$/)) {
	var fs = require("fs"),
		stream = fs.open(testUrl, "r"),
		content = stream.read(),
		suite = JSON.parse(content),
		i, reports = [];
	
	stream.close();	
	
	suite.tests.forEach(function(itemUrl, idx) {
		runTest(itemUrl, suite.tests.length - (idx+1), function (report) {
			reports.push(report);
			if (reports.length === suite.tests.length) {
				console.log(JSON.stringify(reports, null, 2));
			}
		});
	});
}
