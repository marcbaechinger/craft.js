//built by craft.js -- Sat Feb 25 2012 01:29:49 GMT+0100 (CET)

// /Users/marcbaechinger/projects/node/craft-js/resources/src/controller/init-module.js
/* @author marcbaechinger */
var controller = controller || { version: "0.0.1" }; 


// /Users/marcbaechinger/projects/node/craft-js/resources/src/controller/controller.js
//= require "init-module"
/*global $: false, controller: false, localStorage: false */
(function (module, $) {
	var ACTION_EVENT_TAG = "@",
		DEBUG = false,
		DEFAULT_CONTAINER_SELECTOR = "body",
		DEFAULT_SPEC = {
			actionAwareEvents: "click",
			modelValueDataAttribute: "model-val"
		},
		/**
		 * the Controller constructor
		 * 
		 * @param spec {
		 *			elementSelectors: {},
		 *			events: {},
		 *			onStart: fn, 
		 *			containerSelector: "#container"
		 *		  }
		 **/
		Controller = function (spec) {	
			$.extend(this, DEFAULT_SPEC, spec);
			return this;
		};
		
	/**
	 * initialize the application
	 *
	 *    1) look up event handlers in modules.app.actions 
	 **/
	Controller.prototype.init = function () {	
		
		this.containerSelector = this.containerSelector || DEFAULT_CONTAINER_SELECTOR;
		if (!this.container) {
			this.container = $(this.containerSelector);
		}
		delete this.containerSelector;
	
		this.resolveUIElements();
		this.attachEvents();
		this.bindActionHandler();
		
		console.log("controller started: " , this );
		return this;
	};
	Controller.prototype.bindActionHandler = function () {
		var that = this;
		// catch and execute actions
		if (DEBUG) { console.log("bind action handler to '" + this.actionAwareEvents + "'"); }
		this.container.bind(this.actionAwareEvents, function (e) {
			var target = $(e.target).closest("[data-action]"),
				actionName = target.data("action");
			
			if (e.type[0] === "@") {
				if (DEBUG) { console.log("caught and reroute action event " + e.type, e.target, arguments[1], that); }
				actionName = e.type.substring(1);
			}
			
			if (typeof that.actions[actionName] === "function") {
				that.actions[actionName].apply(that, arguments); // execute action
				e.preventDefault();
				e.stopPropagation();
			}
		});
	};
	Controller.prototype.attachEvents = function () {
		var eventExpression, expressionTokens, eventName, selector,
			actionList = " ",
			that = this;
		
		this.actions = this.actions || [];
		
		for (eventExpression in this.events) {
			if (this.events.hasOwnProperty(eventExpression)) {
				expressionTokens = eventExpression.split(" ");

				eventName = expressionTokens.shift();
				selector = expressionTokens.join(" ");

				if (eventName[0] === ACTION_EVENT_TAG) {
					if (DEBUG) {
						console.log("attachEvents(" + eventExpression + ") -> register action handler " 
									+ "controller('" + this.container + "').events['" + eventExpression + "'] for action '" 
									+ eventName + "'");
					}
					this.actions[eventName.substring(1)] = this.events[eventExpression];
					if (actionList.indexOf(eventName + " ") === -1) {
						actionList +=  eventName + " ";	
					}
				} else {
					if (DEBUG) {
						console.log("attachEvents(" + eventExpression + ") -> delegate '" + eventName
									+ "' of elements matching '" + selector 
									+ "' to controller('" + this.container + "').events['" + eventExpression + "']");
					}
					this.container.delegate(selector, eventName, this.createDelegator(eventExpression));	
				}
			}
		}
		// extend events to be catched
		this.actionAwareEvents += actionList;
		if (DEBUG) { console.log("events to be bound to after attaching actions: '" + this.actionAwareEvents + "'"); }
	};
	Controller.prototype.createDelegator = function (eventExpression) {
		var that = this;
		return function (e) {
			that.events[eventExpression].call(that, e);
		};
	};
	
	Controller.prototype.resolveUIElements = function () {
		var name, selector;
		this.$elements = this.$elements || {};
		if (this.scann === true) {
			this.scannForElements();
		}
		if (this.elementSelectors) {
			for (name in this.elementSelectors) {
				if (this.elementSelectors.hasOwnProperty(name)) {
					selector = this.elementSelectors[name];
					if (DEBUG) { console.log("resolveUIElement(" + name + "-" + selector + ") -> attach element with selector '" + selector + "' to this.$elements." + name); }
					this.$elements[name] = this.container.find(selector);
				}
			}
		}
	};
	Controller.prototype.scannForElements = function () {
		var $elements = this.$elements, that = this;
		this.container.find("[data-" + this.modelValueDataAttribute + "]").each(function () {
			var el = $(this);
			if (DEBUG) { console.log("Controller.scannForElements(): found element with att 'data-" + that.modelValueDataAttribute + "'"); }
			$elements[el.data(that.modelValueDataAttribute)] = el;
		});
	};
	/**
	 * export constructor as module
	 **/
	module.Controller = Controller;
	module.renderer = {};
}(controller, $));


// /Users/marcbaechinger/projects/node/craft-js/resources/src/model/init-module.js
/* @author marcbaechinger */
var model = model || { version: "1.0" }; 

// /Users/marcbaechinger/projects/node/craft-js/resources/src/model/observable.js
//= require "init-module"
/*global model: false */
(function (global) {
	var Observable = function () {
		this.observerMap = {};
		return this;
	};
	/**
	 * unbinds a given <code>callback</code> from the event of <code>type</code>.
	 * 
	 * @param {String} type the type of the event from which to unbind
	 * @param {Function} callback the callback function to be unbound
	 **/
	Observable.prototype.unbind = function (type, callback) {
		var observers = this.observerMap[type],
			i;
		if (observers) {
			for (i = 0; i < observers.length; i += 1) {
				if (observers[i] === callback) {
					observers.splice(i, 1);
					break;
				}
			}
		}
		return this;
	};
	/**
	 * bind <code>callback</code> to events of type <code>type</code>.
	 * 
	 * @param {String} type
	 * @param {Object} callback
	 **/
	Observable.prototype.bind = function (type, callback) {
		if (!this.observerMap[type]) {
			this.observerMap[type] = [];
		}
		this.observerMap[type].unshift(callback);
		return this;
	};
	/**
	 * emits a message of type <code>type</code> to al observers bound to that event.
	 * 
	 * @param {String} type
	 * @param {Object} message
	 **/
	Observable.prototype.emit = function (type) {
		var i, args = Array.prototype.slice.call(arguments, 1);
		if (this.observerMap[type]) {
			for (i = 0; i < this.observerMap[type].length; i += 1) {
				this.observerMap[type][i].apply(this, args);
			}
		}
		return this;
	};
	global.Observable = Observable;
}(model));
// /Users/marcbaechinger/projects/node/craft-js/resources/src/model/collection.js
//= require "init-module"
//= require "observable"
/*global model: false */
(function (module) {
	var toString = Object.prototype.toString,
		arrStr = toString.call([]),
		isArray = function (obj) {
			return toString.call(obj) === arrStr;
		},
		keyPropertyName = "id",
		Collection = function (spec) {
			model.Observable.call(this);
			this.init(spec);
		},
		Model = function (spec) {
			model.Observable.call(this);
			this.init(spec);
		};
	
	Model.prototype = new model.Observable();
	Model.prototype.init = function (spec) {
		this.data = this.convertArraysFieldsToCollection(spec.data || {});
		this.id = spec.data[keyPropertyName];
	};
	Model.prototype.convertArraysFieldsToCollection = function(data) {
		var name;
		for (name in data) {
			if (data.hasOwnProperty(name) && isArray(data[name])) {
				if (data[name].length < 1 || typeof data[name][0] === "object") {
					data[name] = new model.Collection({
						data: data[name]
					});
				}
			}
		}
		return data;
	};
	Model.prototype.get = function (name) {
		var val;
		if (typeof name !== "undefined") {
			return this.data[name];
		}
		return this.data;
	};
	Model.prototype.set = function (data) {
		var propName, value;
		for (propName in data) { 
			if (data.hasOwnProperty(propName)) {
				value = data[propName];
				if (isArray(value) && typeof value[0] === "object") {
					this.data[propName] = new Collection({
						data: value
					});
				} else if (propName !== keyPropertyName) {
					this.data[propName] = value;
				}
			}
		}	
		this.emit("change", this);
	};
	Model.prototype.delete = function (data) {
		var propName;
		for (propName in data) { 
			if (data.hasOwnProperty(propName)) {
				if (propName !== keyPropertyName) {
					data[propName] = this.data[propName];
					delete this.data[propName];
				} else if (propName === keyPropertyName) {
					delete data[propName];
				}
			}
		}
		this.emit("remove", this);
	};
	Model.prototype.toString = function () {
		var str = this.data.label || this.data.name || this.data.title || "model: " + this.id;
		return str;
	};
	
	/**
	 * Collection
	 */
	Collection.prototype = new model.Observable();
	Collection.prototype.init = function (spec) {
		this.onChange = (function (that) {
			return function (data) {
				var pos;
				for (pos = 0; pos < that.data.length; pos++) {
					if (data.id === that.data[pos].id) {
						that.emit("change", data, pos);
						break;
					}
				}
			};
		}(this));
		
		this.data = [];
		if (spec.data) {
			this.add(spec.data);
		}
	};
	Collection.prototype.addSingle = function (data, silent) {
		var that = this,
			model = new Model({
				data: data
			});
			
		model.bind("change", this.onChange);
		this.data.push(model);
		
		if (!silent) {
			this.emit("add", model, this.data.length - 1);
		}
		return model;
	};
	Collection.prototype.selectByPosition = function(pos, silent) {
		if (pos > -1 && pos < this.data.length) {
			this.selectedPosition = pos;
			this.selectedModel = this.data[pos];
		} else if (pos > -1) {
			this.selectedPosition = this.data.length - 1;
			this.selectedModel = this.data[this.data.length - 1];
		} else if (pos <= 0) {
			this.selectedPosition = -1;
			delete this.selectedModel;
		}
		if (!silent) {
			this.emit("selection", this.selectedModel, this.selectedPosition);
		}
	};
	Collection.prototype.selectById = function(id, silent) {
		var position = this.getPositionById(id);
		if (position > -1) {
			this.selectByPosition(position, silent);
		}
	};
	Collection.prototype.getSelectedModel = function() {
		return this.selectedModel;
	};
	Collection.prototype.getSelectedPosition = function() {
		return this.selectedPosition;
	};
	Collection.prototype.add = function (data, silent) {
		var i, items = [];
		if (isArray(data)) {
			for (i = 0; i < data.length; i++) {
				items.push(this.addSingle(data[i], true));
			}	
			if (!silent) {
				this.emit("add", items);
			}
			return items;
		} else {
			return this.addSingle(data, silent);
		}
	};
	Collection.prototype.removeSingle = function (data, silent) {
		var i, model;
		for (i = 0; i < this.data.length; i++) {
			if (data.id === this.data[i].id) {
				model = this.data[i];
				this.data.splice(i, 1);
				if (this.selectedPosition === i) {
					delete this.selectedPosition;
					delete this.selectedModel;
				} else if (this.selectedPosition > i) {
					this.selectedPosition -= 1;
				}
				model.unbind("change", this.onChange);
				if (!silent) {
					this.emit("remove", model, i);
				}
				return model;
			}
		}
		return undefined;
	};
	Collection.prototype.removeByPosition = function(pos, silent) {
		var removedItem;
		if (pos > -1 && pos < this.data.length) {
			removedItem = this.removeSingle(this.data[pos], silent);
		}
		return removedItem;
	};
	Collection.prototype.remove = function(data, silent) {
		var i, items = [];
		if (isArray(data)) {
			for (i = data.length - 1; i >= 0; i--) {
				items.unshift(this.removeSingle(data[i], true));
			}
			if (!silent) {
				this.emit("remove", items);	
			}
			return items;
		} else {	
			return this.removeSingle(data, silent);
		}
	};
	Collection.prototype.empty = function() { return this.data.length < 1; };
	Collection.prototype.byId = function (id) {
		var i;
		for (i = 0; i < this.data.length; i++) {
			if (id === this.data[i].id) {
				return this.data[i];
			}
		}
		return undefined;
	};
	Collection.prototype.getPositionById = function (id) {
		var i;
		for (i = 0; i < this.data.length; i++) {
			if (id === this.data[i].id) {
				return i;
			}
		}
		return -1;
	};
	Collection.prototype.byPosition = function (pos) {
		return this.data[pos];
	};
	Collection.prototype.toString = function() {
		var buf = "[", i, start = this.data.length - 1;
		for (i =  start; i >= 0; i--){
			buf += "'" + this.data[(start)-i].toString() + "'";
			if (i) buf += ",";
		}
		return buf + "]";
	};
	
	// exports
	module.Model = Model;
	module.Collection = Collection;
}(model));


// /Users/marcbaechinger/projects/node/craft-js/resources/src/controller/model-aware-controller.js
//= require "init-module"
//= require "controller"
//= require "../model/collection"
/*global $: false, controller: false, localStorage: false */
(function (module, $) {
	var DEBUG = false,
		arrStr = Object.prototype.toString.call([]),
		util = {
			isArray: function (obj) {
				return Object.prototype.toString.call(obj) === arrStr;
			},
			bindThis: function (target, funct) {
				return function () {
					funct.apply(target, arguments);
				};
			}
		},
		/**
		 * SPEC properties are exposed to public as a property of the controller
		 */
		DEFAULT_SPEC = {
			collectionItemTagName: "li",
			collectionItemIdAttName: "data-ui-id",
			onModelRemove: function (model, pos) {
				if (pos > -1 && util.isArray(this.model.data)) {
					this.container
						.find("[" + this.collectionItemIdAttName + "=" + model.data.id + "]")
						.remove();
				} else {
					this.render();
				}
			},
			onModelAdd: function (model, pos) {
				if (pos > -1 && util.isArray(this.model.data)) {
					this.container.append(this.renderItem(model));
				} else {
					this.render();
				}
			},
			onModelChange: function (model, pos) {
				if (pos > -1 && util.isArray(this.model.data)) {
					this.container
						.find("[" + this.collectionItemIdAttName + "=" + model.id + "]")
						.replaceWith(this.renderItem(model));
				} else {
					this.render();
				}
			},
			onSelectionChange: function (model, pos) {}
		},
		/**
		 * the ModelAwareControllerController constructor
		 * 
		 * @param spec {
		 *			model: model.Model || model.Collection
		 *		  }
		 **/
		ModelAwareController = function (spec) {	
			// inherit from controller constructor
			controller.Controller.call(this, spec);
			
			// make sure to call this.onModelChange always in the context of this
			this.boundOnChange = util.bindThis(this, function (model, pos) { 
				if (typeof this.onModelChange === "function") {
					this.onModelChange(model, pos);
				}
				this.container.trigger("@model-change", {model: model, pos: pos});
			});
			// make sure to call this.onModelRemove always in the context of this
			this.boundOnRemove = util.bindThis(this, function (model, pos) { 
				if (typeof this.onModelRemove === "function") {
					this.onModelRemove(model, pos);
				}
				this.container.trigger("@model-remove", {model: model, pos: pos});
			});
			// make sure to call this.onModelAdd always in the context of this
			this.boundOnAdd = util.bindThis(this, function (model, pos) {
				if (typeof this.onModelAdd === "function") {
					this.onModelAdd(model, pos);
				} 
				this.container.trigger("@model-add", {model: model, pos: pos});
			});
			// make sure to call this.onSelectionChange always in the context of this
			this.boundOnSelection = util.bindThis(this, function (model, pos) {
				if (typeof this.onSelectionChange === "function") {
					this.onSelectionChange(model, pos);
				} 
				this.container.trigger("@selection", {model: model, pos: pos});
			});
			return this;
		};
		
	ModelAwareController.prototype = new controller.Controller(DEFAULT_SPEC);	
	ModelAwareController.prototype.init = function () {	
		controller.Controller.prototype.init.apply(this, arguments);
		
		if(this.renderTargetSelector) {
			this.renderTarget = this.container.find(this.renderTargetSelector);
		} else {
			this.renderTarget = this.container;				
		}
		
		this.compositeControllers = {};
		this.setModel(this.model);
		
		return this;
	};
	ModelAwareController.prototype.setModel = function (model) {
		if (this.model) {
			this.detachFromModel(this.model);
		}
		this.model = model;
		if (typeof this.model !== "undefined") {
			this.attachToModel(model);
			this.render();	
		}
		this.container.trigger("@model-set", this.model);
	};
	
	
	ModelAwareController.prototype.attachToModel = function (model) {
		//console.log("attachToModel(): ", this, model);
		if (util.isArray(model.data)) {
			model.bind("remove", this.boundOnRemove);
			model.bind("add", this.boundOnAdd);	
			model.bind("change", this.boundOnChange);
			model.bind("selection", this.boundOnSelection);
		} else {
			model.bind("change", this.boundOnChange);
			model.bind("remove", this.boundOnRemove);
		}
	};
	ModelAwareController.prototype.detachFromModel = function (model) {
		//console.log("detachFromModel(): ", this, model);
		if (util.isArray(model.data)) {
			model.unbind("remove", this.boundOnRemove);
			model.unbind("add", this.boundOnAdd);	
			model.unbind("change", this.boundOnChange);
			model.unbind("selection", this.boundOnSelection);
		} else {
			model.unbind("change", this.boundOnChange);
			model.unbind("remove", this.boundOnRemove);
		}
	};
	
	
	ModelAwareController.prototype.render = function () {
		var that = this,
			buf = "",
			pos = 0;
			
		if (util.isArray(this.model.data)) {
			$(this.model.data).each(function () {	
				// delegate rendering of a single item to function renderItem(item)
				buf += that.renderItem(this, pos++);
			});
			// TODO introduce a renderTarget to allow custom markup inside list view
			this.renderTarget.html(buf);
		} else {
			this.mapDataToUI(this.model.data);
		}
	};
	ModelAwareController.prototype.renderItem = function (item) {
		return [ "<", this.collectionItemTagName, " ", this.collectionItemIdAttName, "='", item.id + "'>", 
					"<span class='name'>", item, "</span></", this.collectionItemTagName, ">" ].join("");
	};
	
	
	ModelAwareController.prototype.mapDataToUI = function (data) {
		var name, value, el, tagName;
		for (name in this.$elements) {
			el = this.$elements[name];
			if (el.length && this.$elements.hasOwnProperty(name) && el[0].getAttribute("data-model-val")) {				
				value = data[name] || "";
				tagName = el[0].tagName;				
				if (util.isArray(value.data)) {
					this.mapCollectionToUI(name, value, el);
				} else if (tagName === "INPUT" || tagName === "TEXTAREA"  || tagName === "HIDDEN") {
					el.val(value);
				} else {
					el.text(value);
				}
			}
		} 
	};
	ModelAwareController.prototype.mapCollectionToUI = function(fieldName, modelCollection, listContainer) {
		var spec = {
			container: listContainer,
			model: modelCollection
		}, renderer;
		
		if (this.compositeControllers[fieldName]) {
			this.compositeControllers[fieldName].setModel(modelCollection);	
		} else {
			// a custom renderer might be registered on the markup container
			renderer = listContainer.data("ui-renderer");
			if (renderer) {
				spec.renderItem = controller.renderer[renderer];
			}	
			// create controller once and register it as composite controller
			this.compositeControllers[fieldName] = new ModelAwareController(spec).init();
		}
	};
	/**
	 * export constructor as module
	 **/
	module.ModelAwareController = ModelAwareController;
}(controller, $));
// /Users/marcbaechinger/projects/node/craft-js/resources/src/applications/craftjs/constants.js
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
// /Users/marcbaechinger/projects/node/craft-js/resources/src/applications/craftjs/services.js
/*global jQuery: false, alert: false, document: false, craftjs: false*/
(function (exports, $) {
	
	exports.craftjs.services = exports.craftjs.services || {};

	exports.craftjs.services.storeJob = function (job, callback) {
		$.ajax("/jobs", {
			type: "PUT",
			data: JSON.stringify(job),
			dataType: "json",
			contentType: "application/json",
			success: function (jsonData) {
				if (callback) {
					callback(jsonData);
				}
			}
		});
	};
	// FIXME remove dependency to craftjs.data.dist
	exports.craftjs.services.release = function (job, callback) {
		$.ajax("/release", {
			type: "POST",
			data: JSON.stringify(job),
			dataType: "json",
			contentType: "application/json",
			error: function(res) {
				if (callback) {
					callback(undefined, res);	
				} else {
					console.log(res);
				}
			},
			success: function (res) {
				if (callback) {
					callback(res);
				} else {
					console.log("res", res);
					document.location = "/" + craftjs.data.dist + "/" + res.path;
				}
			}
		});
	};


	exports.craftjs.services.deleteRelease = function (path, callback) {
		$.ajax("/project/build" + path, {
			type: "DELETE",
			dataType: "json",
			contentType: "application/json",
			success: function (jsonData) {
				if (callback && jsonData.status === "OK") {
					callback();
				}
			}
		});
	};

	exports.craftjs.services.deleteFile = function (path, callback) {
		$.ajax("/" + craftjs.data.context + "/" + path, {
			type: "DELETE",
			dataType: "json",
			contentType: "application/json",
			success: function (jsonData) {
				if (callback && jsonData.status === "OK") {
					callback();
				}
			}
		});
	};
	
}(this, jQuery));
// /Users/marcbaechinger/projects/node/craft-js/resources/src/applications/craftjs/lib/mustache.js
/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */
var Mustache = (typeof module !== "undefined" && module.exports) || {};

(function (exports) {

  exports.name = "mustache.js";
  exports.version = "0.5.0-dev";
  exports.tags = ["{{", "}}"];
  exports.parse = parse;
  exports.compile = compile;
  exports.render = render;
  exports.clearCache = clearCache;

  // This is here for backwards compatibility with 0.4.x.
  exports.to_html = function (template, view, partials, send) {
    var result = render(template, view, partials);

    if (typeof send === "function") {
      send(result);
    } else {
      return result;
    }
  };

  var _toString = Object.prototype.toString;
  var _isArray = Array.isArray;
  var _forEach = Array.prototype.forEach;
  var _trim = String.prototype.trim;

  var isArray;
  if (_isArray) {
    isArray = _isArray;
  } else {
    isArray = function (obj) {
      return _toString.call(obj) === "[object Array]";
    };
  }

  var forEach;
  if (_forEach) {
    forEach = function (obj, callback, scope) {
      return _forEach.call(obj, callback, scope);
    };
  } else {
    forEach = function (obj, callback, scope) {
      for (var i = 0, len = obj.length; i < len; ++i) {
        callback.call(scope, obj[i], i, obj);
      }
    };
  }

  var spaceRe = /^\s*$/;

  function isWhitespace(string) {
    return spaceRe.test(string);
  }

  var trim;
  if (_trim) {
    trim = function (string) {
      return string == null ? "" : _trim.call(string);
    };
  } else {
    var trimLeft, trimRight;

    if (isWhitespace("\xA0")) {
      trimLeft = /^\s+/;
      trimRight = /\s+$/;
    } else {
      // IE doesn't match non-breaking spaces with \s, thanks jQuery.
      trimLeft = /^[\s\xA0]+/;
      trimRight = /[\s\xA0]+$/;
    }

    trim = function (string) {
      return string == null ? "" :
        String(string).replace(trimLeft, "").replace(trimRight, "");
    };
  }

  var escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;'
  };

  function escapeHTML(string) {
    return String(string).replace(/&(?!\w+;)|[<>"']/g, function (s) {
      return escapeMap[s] || s;
    });
  }

  /**
   * Adds the `template`, `line`, and `file` properties to the given error
   * object and alters the message to provide more useful debugging information.
   */
  function debug(e, template, line, file) {
    file = file || "<template>";

    var lines = template.split("\n"),
        start = Math.max(line - 3, 0),
        end = Math.min(lines.length, line + 3),
        context = lines.slice(start, end);

    var c;
    for (var i = 0, len = context.length; i < len; ++i) {
      c = i + start + 1;
      context[i] = (c === line ? " >> " : "    ") + context[i];
    }

    e.template = template;
    e.line = line;
    e.file = file;
    e.message = [file + ":" + line, context.join("\n"), "", e.message].join("\n");

    return e;
  }

  /**
   * Looks up the value of the given `name` in the given context `stack`.
   */
  function lookup(name, stack, defaultValue) {
    if (name === ".") {
      return stack[stack.length - 1];
    }

    var names = name.split(".");
    var lastIndex = names.length - 1;
    var target = names[lastIndex];

    var value, context, i = stack.length, j, localStack;
    while (i) {
      localStack = stack.slice(0);
      context = stack[--i];

      j = 0;
      while (j < lastIndex) {
        context = context[names[j++]];

        if (context == null) {
          break;
        }

        localStack.push(context);
      }

      if (context && target in context) {
        value = context[target];
        break;
      }
    }

    // If the value is a function, call it in the current context.
    if (typeof value === "function") {
      value = value.call(localStack[localStack.length - 1]);
    }

    if (value == null)  {
      return defaultValue;
    }

    return value;
  }

  function renderSection(name, stack, callback, inverted) {
    var buffer = "";
    var value =  lookup(name, stack);

    if (inverted) {
      // From the spec: inverted sections may render text once based on the
      // inverse value of the key. That is, they will be rendered if the key
      // doesn't exist, is false, or is an empty list.
      if (value == null || value === false || (isArray(value) && value.length === 0)) {
        buffer += callback();
      }
    } else if (isArray(value)) {
      forEach(value, function (value) {
        stack.push(value);
        buffer += callback();
        stack.pop();
      });
    } else if (typeof value === "object") {
      stack.push(value);
      buffer += callback();
      stack.pop();
    } else if (typeof value === "function") {
      var scope = stack[stack.length - 1];
      var scopedRender = function (template) {
        return render(template, scope);
      };
      buffer += value.call(scope, callback(), scopedRender) || "";
    } else if (value) {
      buffer += callback();
    }

    return buffer;
  }

  /**
   * Parses the given `template` and returns the source of a function that,
   * with the proper arguments, will render the template. Recognized options
   * include the following:
   *
   *   - file     The name of the file the template comes from (displayed in
   *              error messages)
   *   - tags     An array of open and close tags the `template` uses. Defaults
   *              to the value of Mustache.tags
   *   - debug    Set `true` to log the body of the generated function to the
   *              console
   *   - space    Set `true` to preserve whitespace from lines that otherwise
   *              contain only a {{tag}}. Defaults to `false`
   */
  function parse(template, options) {
    options = options || {};

    var tags = options.tags || exports.tags,
        openTag = tags[0],
        closeTag = tags[tags.length - 1];

    var code = [
      'var buffer = "";', // output buffer
      "\nvar line = 1;", // keep track of source line number
      "\ntry {",
      '\nbuffer += "'
    ];

    var spaces = [],      // indices of whitespace in code on the current line
        hasTag = false,   // is there a {{tag}} on the current line?
        nonSpace = false; // is there a non-space char on the current line?

    // Strips all space characters from the code array for the current line
    // if there was a {{tag}} on it and otherwise only spaces.
    var stripSpace = function () {
      if (hasTag && !nonSpace && !options.space) {
        while (spaces.length) {
          code.splice(spaces.pop(), 1);
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    };

    var sectionStack = [], updateLine, nextOpenTag, nextCloseTag;

    var setTags = function (source) {
      tags = trim(source).split(/\s+/);
      nextOpenTag = tags[0];
      nextCloseTag = tags[tags.length - 1];
    };

    var includePartial = function (source) {
      code.push(
        '";',
        updateLine,
        '\nvar partial = partials["' + trim(source) + '"];',
        '\nif (partial) {',
        '\n  buffer += render(partial,stack[stack.length - 1],partials);',
        '\n}',
        '\nbuffer += "'
      );
    };

    var openSection = function (source, inverted) {
      var name = trim(source);

      if (name === "") {
        throw debug(new Error("Section name may not be empty"), template, line, options.file);
      }

      sectionStack.push({name: name, inverted: inverted});

      code.push(
        '";',
        updateLine,
        '\nvar name = "' + name + '";',
        '\nvar callback = (function () {',
        '\n  return function () {',
        '\n    var buffer = "";',
        '\nbuffer += "'
      );
    };

    var openInvertedSection = function (source) {
      openSection(source, true);
    };

    var closeSection = function (source) {
      var name = trim(source);
      var openName = sectionStack.length != 0 && sectionStack[sectionStack.length - 1].name;

      if (!openName || name != openName) {
        throw debug(new Error('Section named "' + name + '" was never opened'), template, line, options.file);
      }

      var section = sectionStack.pop();

      code.push(
        '";',
        '\n    return buffer;',
        '\n  };',
        '\n})();'
      );

      if (section.inverted) {
        code.push("\nbuffer += renderSection(name,stack,callback,true);");
      } else {
        code.push("\nbuffer += renderSection(name,stack,callback);");
      }

      code.push('\nbuffer += "');
    };

    var sendPlain = function (source) {
      code.push(
        '";',
        updateLine,
        '\nbuffer += lookup("' + trim(source) + '",stack,"");',
        '\nbuffer += "'
      );
    };

    var sendEscaped = function (source) {
      code.push(
        '";',
        updateLine,
        '\nbuffer += escapeHTML(lookup("' + trim(source) + '",stack,""));',
        '\nbuffer += "'
      );
    };

    var line = 1, c, callback;
    for (var i = 0, len = template.length; i < len; ++i) {
      if (template.slice(i, i + openTag.length) === openTag) {
        i += openTag.length;
        c = template.substr(i, 1);
        updateLine = '\nline = ' + line + ';';
        nextOpenTag = openTag;
        nextCloseTag = closeTag;
        hasTag = true;

        switch (c) {
        case "!": // comment
          i++;
          callback = null;
          break;
        case "=": // change open/close tags, e.g. {{=<% %>=}}
          i++;
          closeTag = "=" + closeTag;
          callback = setTags;
          break;
        case ">": // include partial
          i++;
          callback = includePartial;
          break;
        case "#": // start section
          i++;
          callback = openSection;
          break;
        case "^": // start inverted section
          i++;
          callback = openInvertedSection;
          break;
        case "/": // end section
          i++;
          callback = closeSection;
          break;
        case "{": // plain variable
          closeTag = "}" + closeTag;
          // fall through
        case "&": // plain variable
          i++;
          nonSpace = true;
          callback = sendPlain;
          break;
        default: // escaped variable
          nonSpace = true;
          callback = sendEscaped;
        }

        var end = template.indexOf(closeTag, i);

        if (end === -1) {
          throw debug(new Error('Tag "' + openTag + '" was not closed properly'), template, line, options.file);
        }

        var source = template.substring(i, end);

        if (callback) {
          callback(source);
        }

        // Maintain line count for \n in source.
        var n = 0;
        while (~(n = source.indexOf("\n", n))) {
          line++;
          n++;
        }

        i = end + closeTag.length - 1;
        openTag = nextOpenTag;
        closeTag = nextCloseTag;
      } else {
        c = template.substr(i, 1);

        switch (c) {
        case '"':
        case "\\":
          nonSpace = true;
          code.push("\\" + c);
          break;
        case "\r":
          // Ignore carriage returns.
          break;
        case "\n":
          spaces.push(code.length);
          code.push("\\n");
          stripSpace(); // Check for whitespace on the current line.
          line++;
          break;
        default:
          if (isWhitespace(c)) {
            spaces.push(code.length);
          } else {
            nonSpace = true;
          }

          code.push(c);
        }
      }
    }

    if (sectionStack.length != 0) {
      throw debug(new Error('Section "' + sectionStack[sectionStack.length - 1].name + '" was not closed properly'), template, line, options.file);
    }

    // Clean up any whitespace from a closing {{tag}} that was at the end
    // of the template without a trailing \n.
    stripSpace();

    code.push(
      '";',
      "\nreturn buffer;",
      "\n} catch (e) { throw {error: e, line: line}; }"
    );

    // Ignore `buffer += "";` statements.
    var body = code.join("").replace(/buffer \+= "";\n/g, "");

    if (options.debug) {
      if (typeof console != "undefined" && console.log) {
        console.log(body);
      } else if (typeof print === "function") {
        print(body);
      }
    }

    return body;
  }

  /**
   * Used by `compile` to generate a reusable function for the given `template`.
   */
  function _compile(template, options) {
    var args = "view,partials,stack,lookup,escapeHTML,renderSection,render";
    var body = parse(template, options);
    var fn = new Function(args, body);

    // This anonymous function wraps the generated function so we can do
    // argument coercion, setup some variables, and handle any errors
    // encountered while executing it.
    return function (view, partials) {
      partials = partials || {};

      var stack = [view]; // context stack

      try {
        return fn(view, partials, stack, lookup, escapeHTML, renderSection, render);
      } catch (e) {
        throw debug(e.error, template, e.line, options.file);
      }
    };
  }

  // Cache of pre-compiled templates.
  var _cache = {};

  /**
   * Clear the cache of compiled templates.
   */
  function clearCache() {
    _cache = {};
  }

  /**
   * Compiles the given `template` into a reusable function using the given
   * `options`. In addition to the options accepted by Mustache.parse,
   * recognized options include the following:
   *
   *   - cache    Set `false` to bypass any pre-compiled version of the given
   *              template. Otherwise, a given `template` string will be cached
   *              the first time it is parsed
   */
  function compile(template, options) {
    options = options || {};

    // Use a pre-compiled version from the cache if we have one.
    if (options.cache !== false) {
      if (!_cache[template]) {
        _cache[template] = _compile(template, options);
      }

      return _cache[template];
    }

    return _compile(template, options);
  }

  /**
   * High-level function that renders the given `template` using the given
   * `view` and `partials`. If you need to use any of the template options (see
   * `compile` above), you must compile in a separate step, and then call that
   * compiled function.
   */
  function render(template, view, partials) {
    return compile(template)(view, partials);
  }

})(Mustache);

// /Users/marcbaechinger/projects/node/craft-js/resources/src/applications/craftjs/renderer.js
/*global global: false, Mustache: false */
//= require "lib/mustache"
(function (exports) {
	var templateCache = {};
	
	exports.craftjs.render = function (template, renderData) {
		return Mustache.render(template, renderData);
	};
	exports.craftjs.renderById = function (templateId, renderData) {
		if (!templateCache[templateId]) {
			templateCache[templateId] = $("#" + templateId).text();
		}		
		return Mustache.render(templateCache[templateId], renderData);
	};
	
}(typeof global === "undefined" ? this : global));
// /Users/marcbaechinger/projects/node/craft-js/resources/src/applications/craftjs/controller/page-controller.js
/*global controller: false, craftjs: false, jQuery: false, ALL_BUILD_FLAGS: false, document: false, console: true, prompt: false, localStorage */
//= require "../../../controller/model-aware-controller"
//= require "../constants"
(function (exports, $) {
	var PageController = function PageController(model, buildFlagProvider) {
			return new controller.ModelAwareController({
				path: craftjs.data.path,
				model: model,
				elementSelectors: {
					buttons: ".bag-button",
					projectLabel: ".project-name"
				},
				events: {
					"@nav": function (e) {
						var target = $(e.target),
							path = target.data("path");

						if (path) {
							document.location = path;
						}
					},
					"@toggle-file-to-job": function () {
						var slice = {};
						slice[craftjs.data.path] = {};
						if (this.model.data[craftjs.data.path]) {
							this.model.delete(slice);
						} else {
							this.model.set(slice);
						}
					},
					"@delete-file": function (e) {
						var target = $(e.target),
							path = target.data("path");
						if (path) {
							craftjs.services.deleteFile(path, function () {
								target.closest("li").remove();
							});
						}
					},
					// TODO [sprint-1] to complex => refactor
					"@toggle-source-markers": function () {
						var markerPattern = /^[ \d]*:.*\/\/.*(FIXME|TODO)/,
							buf = [],
							markerList = $("#markers");
						markerList.empty();
						$(".source pre").each(function () {
							var line = $(this),
								txt = line.text(),
								convert,
								fixme;
							if (txt.match(markerPattern)) {
								line.toggleClass("marker");
								if (line.hasClass("marker")) {
									convert = txt.replace(/\/\//, "");
									fixme = convert.indexOf("FIXME") > -1;

									convert = convert.replace(/FIXME/, "");
									convert = convert.replace(/TODO/, "");
									buf.push("<li><a href='#" + line.attr("id") + "' class='" +
										(fixme ? "fixme" : "todo") + "'>" +
										(fixme ? "FIXME" : "TODO") + "</a> line " + convert + "</li>");
								}
							}
						});
						if (buf.length < 1) {
							buf.push("<li><a>no markers found</a></li>");
						}
						$(".marker-button").remove();
						markerList.html(buf.join(""));
					},
					"@build": function (e) {
						var target = $(e.target),
							path = target.data("path"),
							query = buildFlagProvider(ALL_BUILD_FLAGS, target.closest("li"));

						document.location = "/" + craftjs.data.context + "/" + path  + query;
					},
					"@build-job": function (e) {
						var target = $(e.target),
							path = target.data("path"),
							query = buildFlagProvider(ALL_BUILD_FLAGS, target.closest("li"));

						craftjs.services.release({
							jobfile: path
						}, function(res, err) {
							if (err) {
								alert("error" + JSON.stringify(err));
							} else {
								document.location = "/" + craftjs.data.dist + "/" + res.path;
							}
						});
					},
					"@show-html": function (e) {
						alert("sda");
					},
					"@remove-from-project": function (e) {
						var target = $(e.target),
							path = target.data("path"),
							slice = {};

						slice[path] = {};
						this.model.delete(slice);
					},
					"@edit-project-name": function (e) {
						var name = prompt("Project name", localStorage.projectName);
						if (name) {
							localStorage.projectName = name;
							this.render();
						}
						e.stopPropagation();
					},
					"click .collapse": function (e) {
						var target = $(e.target),
							dependent = target.data("dependent");

						if (dependent) {
							$(dependent).toggle();
						} else if (target.hasClass("collapse")) {
							target.next().toggle();
						}
					}
				},
				render: function () {
					if (this.model.data[this.path]) {
						this.$elements.buttons.addClass("contained").text("remove from project");
					} else {
						this.$elements.buttons.removeClass("contained").text("add to project");
					}
					this.$elements.projectLabel.text(localStorage.projectName);
				}
			});
		};
	exports.craftjs.PageController = PageController;
}(this, jQuery));
// /Users/marcbaechinger/projects/node/craft-js/resources/src/applications/craftjs/controller/toolbar-controller.js
/*global controller: false, document: false, ALL_BUILD_FLAGS: false, craftjs: false,
	jQuery: false, alert: false, prompt: false*/
//= require "../../../controller/model-aware-controller"
//= require "../constants"
(function (exports, $) {
	var buildSingleFile = function (path, transformationFlags) {
			var files = {},
				projectName = prompt("Name of this release");

			if (projectName) {
				if (/[\s]/.test(projectName)) {
					alert("no spaces or tabs allowed");
					return;
				}
				files[path] = {};
				craftjs.services.release({
					name: projectName,
					expand: true,
					files: files,
					transformation: transformationFlags
				});
			}
		},
		ToolbarController = function ToolbarController(containerId, model, buildFlagsProvider) {
			var transformationFlags = [
				"mangle",
				"expand",
				"squeeze",
				"minimize",
				"beautify"
			];
			return new controller.ModelAwareController({
				containerSelector: containerId,
				scann: true,
				model: model,
				elementSelectors: {
					plain: "#plain",
					mangle: "#mangle",
					expand: "#expand",
					squeeze: "#squeeze",
					beautify: "#beautify",
					minimize: "#minimize",
					lint: "#lint",
					release: "#release"
				},
				events: {
					"@build": function (e) {
						var target = $(e.target),
							path = target.data("path"),
							query = buildFlagsProvider(ALL_BUILD_FLAGS, this.container);

						if (this.$elements.release.attr("checked")) {
							buildSingleFile(craftjs.data.path, this.getTransformationFlags());
						} else if (path) {
							document.location = "/" + craftjs.data.context + "/" + path  + query;
						}
					}
				},
				getTransformationFlags: function () {
					var flags = {}, that = this;
					$.each(transformationFlags, function() {
						if (that.$elements[this] && that.$elements[this].attr("checked")) {
							flags[this] = true;
						} else {
							flags[this] = false;
						}
					});
					return flags;
				}
			});
		};

	exports.craftjs.ToolbarController = ToolbarController;
}(this, jQuery));
// /Users/marcbaechinger/projects/node/craft-js/resources/src/applications/craftjs/controller/lint-controller.js
/*global jQuery: false, controller: false, prompt: false, craftjs: false, LINT_DESC: false */
//= require "../../../controller/model-aware-controller"
//= require "../constants"
(function (exports, $) {
	var filterBooleanLintOptions = function (options) {
			return $.map(options, function (val, key) {
				var renderData;
				if (typeof val === "boolean") {
					renderData = {
						key: key,
						val: val,
						desc: LINT_DESC[key],
						on: val === true ? "on" : "off",
						type: typeof val
					};
				}
				return renderData;
			});
		},
		renderLintOptions = function (options, title) {
			return craftjs.renderById("lint-options-tmpl", {
				options: filterBooleanLintOptions(options),
				maxerr: options.maxerr,
				indent: options.indent,
				title: title
			});
		},
		LintController = function LintController(containerId, model) {
			return new controller.ModelAwareController({
				model: model,
				containerSelector: containerId,
				events: {
					"click label": function (e) {
						var target = $(e.target),
							name = target.data("name"),
							slice = {};

						slice[name] = !this.model.data[name];
						this.model.set(slice);
					},
					"@edit-maxerr": function () {
						var maxerr = prompt("max number of errors", this.model.get("maxerr"));
						if (maxerr) {
							this.model.set({maxerr: maxerr});
						}
					},
					"@edit-indent": function () {
						var indent = prompt("number of spaces", this.model.get("indent"));
						if (indent) {
							this.model.set({indent: indent});
						}

					}
				},
				render: function () {
					var buf = [];
					buf.push(renderLintOptions(this.model.data, "JSHint options"));
					this.container.html(buf.join(""));
				},
				toQueryString: function () {
					var buf = "";
					$.each(this.model.data, function (key, val) {
						buf += "lint-" + key + "=" + val + "&";
					});
					return buf;
				}
			});
		};
	exports.craftjs.LintController = LintController;
}(this, jQuery));
// /Users/marcbaechinger/projects/node/craft-js/resources/src/applications/craftjs/controller/jobpanel-controller.js
/*global jQuery: false, controller: false, localStorage: false, craftjs: false*/
//= require "../../../controller/model-aware-controller"
(function (exports, $) {
	var renderCheckBox = function (name) {
			return craftjs.render("<label>{{name}}<input type='checkbox' name='{{name}}'/></label>", {name: name});
		},
		renderProjectItem = function (path) {
			return craftjs.renderById("project-file", {path: path});
		},
		JobPanelController = function JobPanelController(containerId, model) {
			return new controller.ModelAwareController({
				model: model,
				containerSelector: containerId,
				events: {
					"@build-project": function () {
						if (!this.isEmpty()) {
							console.log("this.getTransformFlags()", this.getTransformFlags());
							craftjs.services.release({
								name: localStorage.projectName,
								files: this.model.data,
								expand: true,
								transformation: this.getTransformFlags()
							});
						}
					},
					"@save-job": function () {
						if (!this.isEmpty()) {
							craftjs.services.storeJob({
								// TODO rename to jobName
								name: localStorage.projectName,
								files: this.model.data,
								expand: true,
								transformation: this.getTransformFlags()
							}, function(res) {
								document.location = "/" + craftjs.data.jobs + "/" + res.data.path;
							});
						}
					}
				},
				// TODO render by template
				render: function () {
					var buf = ["<div class='build-flags'>Build flags: "];

					buf.push($.map(["mangle", "squeeze", "minimize", "beautify"], renderCheckBox).join(""));
					buf.push("<button class='build' data-action='build-project'");
					if (this.isEmpty()) {
						buf.push(" disabled='disabled'");
					}
					buf.push(">build</button><button data-action='save-job' class='build'>save</button></div><ul>");
					$.each(this.model.data, function (key) {
						buf.push(renderProjectItem(key));
					});
					buf.push("</ul>");

					this.container.html(buf.join(""));
				},
				isEmpty: function () {
					var path;
					for (path in this.model.data) {
						if (this.model.data.hasOwnProperty(path)) {
							return false;
						}
					}
					return true;
				},
				getTransformFlags: function () {
					var flags = {}, that = this;
					$.each(["mangle", "squeeze", "beautify", "minimize"], function () {
						console.log(this, that.container.find("[name='" + this + "']").attr("checked"));
						if (that.container.find("[name='" + this + "']").attr("checked")) {
							flags[this] = true;
						} else {
							flags[this] = false;
						}
					});
					return flags;
				}
			});
		};
	exports.craftjs.JobPanelController = JobPanelController;
}(this, jQuery));
// /Users/marcbaechinger/projects/node/craft-js/resources/src/applications/craftjs/controller/search-controller.js
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
// /Users/marcbaechinger/projects/node/craft-js/resources/src/applications/craftjs/bootstrap.js
/*jslint browser:true */
/*global $: false, craftjs: false, model: false, LINT_OPTIONS: false, LINT_DESC: false */
//= require "../../controller/model-aware-controller"
//= require "constants, services, renderer"
//= require "controller/page-controller, controller/toolbar-controller"
//= require "controller/lint-controller, controller/jobpanel-controller, controller/search-controller"
$(function () {
	var bag, projectModel, lintOptions, lintModel, pageController, buildToolbarController,
		projectPanelController, lintOptionPanelController, searchController,
		// FIXME test and fix usage from multiple tabs
		// TODO rename to readLocalJob 
		getBag = function () {
			var storageValue;
			if (!bag) {
				storageValue = localStorage.bag;
				bag = storageValue ? JSON.parse(storageValue) : {};
			}
			return bag;
		},
		// TODO rename to  writeLocalJob
		saveBag = function () {
			localStorage.bag = JSON.stringify(bag);
		},
		// TODO rename to readLocalLintOptions
		getLintOptions = function () {
			var storageValue;
			if (!lintOptions) {
				storageValue = localStorage.lintOptions;
				lintOptions = storageValue ? JSON.parse(storageValue) : LINT_OPTIONS;
			}
			return lintOptions;
		},
		// rename to writeLocalLintOptions
		saveLintOptions = function () {
			localStorage.lintOptions = JSON.stringify(lintModel.data);
		},
		getBuildFlags = function (flags, container) {
			var query = "?";
			$.each(flags, function () {
				if (container.find("[name='" + this + "']").attr("checked")) {
					query += this + "=true&";
				}
			});
			if (container.find("[name='lint']").attr("checked")) {
				// TODO use a model acceesor instead of a controller to access model data
				query += lintOptionPanelController.toQueryString();
			}
			return query;
		};

	if (!localStorage.projectName) {
		localStorage.projectName = "default";
	}
	projectModel = new model.Model({
		data: getBag()
	}).bind("change", saveBag)
		.bind("remove", saveBag);

	lintModel = new model.Model({
		data: getLintOptions()
	}).bind("change", saveLintOptions);


	lintOptionPanelController = new craftjs.LintController("#lint-options", lintModel).init();
	buildToolbarController = new craftjs.ToolbarController("#build-toolbar", new model.Model({
		data: {
			expand: false,
			mangel: false,
			squeeze: false,
			minimize: false,
			beautify: false,
			lint: true,
			plain: false,
			release: false
		}
	}), getBuildFlags).init();

	projectPanelController = new craftjs.JobPanelController("#project-files", projectModel).init();
	pageController = new craftjs.PageController(projectModel, getBuildFlags).init();
	searchController = new craftjs.SearchController("search-script", "source", "result-info");
});