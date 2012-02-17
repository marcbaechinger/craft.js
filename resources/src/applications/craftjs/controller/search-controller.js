/*global jQuery: false */
(function (exports, $) {
	var SearchController = function (inputId, scriptContainerId, resultContainerId) {
		var input = $("#" + inputId),
			block = "block",
			hide = "none",
			scriptContainer = $("#" + scriptContainerId),
			resultContainer = $("#" + resultContainerId),
			lineElements = scriptContainer.find(".line"),
			lines = lineElements.map(function () {
				return this.style;
			}),
			textLines = lineElements.map(function () {
				return $(this).text().replace(/^\d*:\t/, "");
			}),
			showAllLines = function () {
				$.each(lines, function (idx) {
					lines[idx].display = "block";
				});
			},
			displayResultInfo = function (matchCount, searchExpr) {
				if (matchCount < 1) {
					resultContainer.html("no matches found for <code>/" + searchExpr + "/</code>");
					showAllLines();
				} else {
					resultContainer.html(matchCount + " matches found for <code>/" + searchExpr + "/</code>");
				}
			};

		lineElements = undefined;
		input.bind("change", function () {
			var matchCount = 0,
				textExpr = input.val(),
				expr;
				
			try {
				expr = new RegExp(textExpr, "ig");
				if (textExpr) {
					textLines.each(function (idx) {
						if (this.match(expr)) {
							lines[idx].display = block;
							matchCount += 1;
						} else {
							lines[idx].display = hide;
						}
					});
					displayResultInfo(matchCount, textExpr);
				} else {
					resultContainer.text("grep source code =>");
					showAllLines();
				}
			} catch (e) {
				alert("RegExp error: '" + e.message + "'");
			}
		});
	};
	
	exports.craftjs.SearchController = SearchController;
}(this, jQuery));