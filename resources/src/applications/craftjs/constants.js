(function (exports) {
	
	exports.craftjs = exports.craftjs || {};
	exports.ALL_BUILD_FLAGS = ["plain", "mangle", "expand", "squeeze", "beautify", "minimize", "lint"];
	exports.LINT_OPTIONS = {
		// Settings
		"passfail" : false, // Stop on first error.
		"maxerr" : 1000, // Maximum error before stopping.

		// Predefined globals whom JSHint will ignore.
		"browser" : true, // Standard browser globals e.g. `window`, `document`.

		"node" : false,
		"rhino" : false,
		"couch" : false,
		"wsh" : false, // Windows Scripting Host.

		"jquery" : true,
		"prototypejs" : false,
		"mootools" : false,
		"dojo" : false,

		// Development.
		"debug" : false, // Allow debugger statements e.g. browser breakpoints.
		"devel" : true, // Allow developments statements e.g. `console.log();`.

		// ECMAScript 5.
		"es5" : true, // Allow ECMAScript 5 syntax.
		"strict" : false, // Require `use strict` pragma in every file.
		"globalstrict" : false, // Allow global "use strict" (also enables 'strict').


		// The Good Parts.
		"asi" : false, // Tolerate Automatic Semicolon Insertion (no semicolons).
		"laxbreak" : true, // Tolerate unsafe line breaks e.g. `return [\n] x` without semicolons.
		"bitwise" : true, // Prohibit bitwise operators (&, |, ^, etc.).
		"boss" : false, // Tolerate assignments inside if, for & while. Usually conditions & loops are for comparison, not assignments.
		"curly" : true, // Require {} for every new block or scope.
		"eqeqeq" : true, // Require triple equals i.e. `===`.
		"eqnull" : false, // Tolerate use of `== null`.
		"evil" : false, // Tolerate use of `eval`.
		"expr" : false, // Tolerate `ExpressionStatement` as Programs.
		"forin" : false, // Tolerate `for in` loops without `hasOwnPrototype`.
		"immed" : true, // Require immediate invocations to be wrapped in parens e.g. `( function (){}() );`
		"latedef" : true, // Prohipit variable use before definition.
		"loopfunc" : false, // Allow functions to be defined within loops.
		"noarg" : true, // Prohibit use of `arguments.caller` and `arguments.callee`.
		"regexp" : true, // Prohibit `.` and `[^...]` in regular expressions.
		"regexdash" : false, // Tolerate unescaped last dash i.e. `[-...]`.
		"scripturl" : true, // Tolerate script-targeted URLs.
		"shadow" : false, // Allows re-define variables later in code e.g. `var x=1; x=2;`.
		"supernew" : false, // Tolerate `new function () { ... };` and `new Object;`.
		"undef" : true, // Require all non-global variables be declared before they are used.


		// Personal styling preferences.
		"newcap" : true, // Require capitalization of all constructor functions e.g. `new F()`.
		"noempty" : true, // Prohibit use of empty blocks.
		"nonew" : true, // Prohibit use of constructors for side-effects.
		"nomen" : true, // Prohibit use of initial or trailing underbars in names.
		"onevar" : false, // Allow only one `var` statement per function.
		"plusplus" : false, // Prohibit use of `++` & `--`.
		"sub" : false, // Tolerate all forms of subscript notation besides dot notation e.g. `dict['key']` instead of `dict.key`.
		"trailing" : true, // Prohibit trailing whitespaces.
		"white" : true, // Check against strict whitespace and indentation rules.
		"indent" : 4 // Specify indentation spacing
	};
	exports.LINT_DESC = {
		// Settings
		"passfail" : "Stop on first error",
		"maxerr" : "Maximum error before stopping",


		"browser" : "Standard browser globals e.g. `window`, `document`",

		"node" : "Allow globals of node.js",
		"rhino" : "Allow globals of rhino",
		"couch" : "Allow globals of couch DB",
		"wsh" : "Allow globals of Windows Scripting Host",

		"jquery" : "allow jquery",
		"prototypejs" : "allow prototypejs",
		"mootools" : "allow mootools",
		"dojo" : "allow dojo",

		"predef" : "Custom globals",


		"debug" : "Allow debugger statements e.g. browser breakpoints",
		"devel" : "Allow developments statements e.g. `console.log();`",


		// ECMAScript 5.
		"es5" : "Allow ECMAScript 5 syntax",
		"strict" : "Require `use strict` pragma in every file",
		"globalstrict" : "Allow global 'use strict' (also enables 'strict')",


		// The Good Parts.
		"asi" : "Tolerate Automatic Semicolon Insertion (no semicolons)",
		"laxbreak" : "Tolerate unsafe line breaks e.g. `return [\n] x` without semicolons",
		"bitwise" : "Prohibit bitwise operators (&, |, ^, etc.)",
		"boss" : "Tolerate assignments inside if, for & while. Usually conditions & loops are for comparison, not assignments",
		"curly" : "Require {} for every new block or scope",
		"eqeqeq" : "Require triple equals i.e. `===`",
		"eqnull" : "Tolerate use of `== null`",
		"evil" : "Tolerate use of `eval`",
		"expr" : "Tolerate `ExpressionStatement` as Programs",
		"forin" : "Tolerate `for in` loops without `hasOwnPrototype`",
		"immed" : "Require immediate invocations to be wrapped in parens e.g. `( function (){}() );`",
		"latedef" : "Prohipit variable use before definition",
		"loopfunc" : "Allow functions to be defined within loops",
		"noarg" : "Prohibit use of `arguments.caller` and `arguments.callee`",
		"regexp" : "Prohibit `.` and `[^...]` in regular expressions",
		"regexdash" : "Tolerate unescaped last dash i.e. `[-...]`",
		"scripturl" : "Tolerate script-targeted URLs",
		"shadow" : "Allows re-define variables later in code e.g. `var x=1; x=2;`",
		"supernew" : "Tolerate `new function () { ... };` and `new Object;`",
		"undef" : "Require all non-global variables be declared before they are used",

		// Personal styling preferences.
		"newcap" : "Require capitalization of all constructor functions e.g. `new F()`",
		"noempty" : "Prohibit use of empty blocks",
		"nonew" : "Prohibit use of constructors for side-effects",
		"nomen" : "Prohibit use of initial or trailing underbars in names",
		"onevar" : "Allow only one `var` statement per function",
		"plusplus" : "Prohibit use of `++` & `--`",
		"sub" : "Tolerate all forms of subscript notation besides dot notation e.g. `dict['key']` instead of `dict.key`",
		"trailing" : "Prohibit trailing whitespaces",
		"white" : "Check against strict whitespace and indentation rules",
		"indent" : "Specify indentation spacing"
	};
}(this));