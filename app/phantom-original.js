/*global window: false, phantom: false */
/*jslint node: true */
var page = require('webpage').create(),
	INTERVAL_MILLIS = 50,
	url = phantom.args[0], //"http://localhost:3000/repo/test/model/model.qunit";
	page;

function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3001, //< Default Max Timout is 3s
        start = new Date().getTime(),
        condition = false,
		time,
        interval = setInterval(function () {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                // If not time-out yet and condition not yet fulfilled
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
                if(!condition) {
                    // If condition still not fulfilled (timeout but condition is 'false')
                    console.log(JSON.stringify({
						url: url,
						status: timeout,
						maxtimeOutMillis: maxtimeOutMillis
					}));
                    phantom.exit(1);
                } else {
					time = (new Date().getTime() - start);
                    // Condition fulfilled (timeout and/or condition is 'true')
                    typeof(onReady) === "string" ? eval(onReady) : onReady(time); //< Do what it's supposed to do once the condition is fulfilled
                    clearInterval(interval); 
                }
            }
        }, INTERVAL_MILLIS);
};


if (phantom.args.length === 0 || phantom.args.length > 2) {
    console.log('Usage: run-qunit.js URL');
    phantom.exit();
}

page = new WebPage();

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function (msg) {
    console.log(msg);
};

page.open(url, function (status){
    if (status !== "success") {
        console.log(JSON.stringify({
			url: url,
			state: status,
			msg: "page returned without state 'success'" 
		}));
        phantom.exit();
    } else {
        waitFor(function (){
            return page.evaluate(function (){
                var el = document.getElementById('qunit-testresult');
                if (el && el.innerText.match('completed')) {
                    return true;
                }
                return false;
            });
        }, function (timeTaken){
            var testState = page.evaluate(function () {
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
            });
			testState.timeTaken = timeTaken;
			testState.url = url;
			testState.timestamp = new Date();
			
			console.log(JSON.stringify(testState, null, 4));
            phantom.exit((parseInt(testState.failed, 10) > 0) ? 1 : 0);
        });
    }
});
