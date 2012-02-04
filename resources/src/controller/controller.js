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

