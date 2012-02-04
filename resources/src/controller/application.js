//= require "init-module"
/*global $: false, controller: false, localStorage: false */
(function (module, $) {
	/**
	 * the Application constructor
	 * 
	 * @param spec {
	 *			storage: {},
	 *			onStart: fn, 
	 *			events: {},
	 *			containerSelector: "#container"
	 *		  }
	 **/
	var Application = function (spec) {
		module.Controller.call(this, spec);
	};
	Application.prototype = new module.Controller({});
	Application.prototype.init = function () {
		
		this.containerSelector = this.containerSelector || "body";
		// call super initialization	
		module.Controller.prototype.init.call(this);
		
		this.initFromStorage();
		
		// call onStart callback
		this.onStart();
		return this;
	};
	// default handler
	Application.prototype.onStart = function () {};
	Application.prototype.initFromStorage = function () {
		var dataProperty, dataString, storageKey;
		
		this.data = this.data || {};
		for (dataProperty in this.storage) {
			if (this.storage.hasOwnProperty(dataProperty)) {
				storageKey = this.storage[dataProperty];
				console.log("loading data property '" + dataProperty + 
							"' from storage by storageKey '" + storageKey   + "'");
				dataString = localStorage.getItem(storageKey);
				if (dataString) {
					this.data[dataProperty] = JSON.parse(dataString);
					console.log("loaded " + dataProperty + " from storage");
				} else if (storageKey[0] === 'a') {
					this.data[dataProperty] = [];
					console.log("defaulting " + dataProperty + " to empty array");
				} else {
					this.data[dataProperty] = {};
					console.log("defaulting " + dataProperty + " to empty object");
				}	
			} 
		}
	};
	
	Application.prototype.store = function (dataProperty) {
		var value;
		if (this.data[dataProperty]) {
			value = JSON.stringify(this.data[dataProperty]);
			console.log("store property " + value + " in " + this.storage[dataProperty]);
			localStorage.setItem(this.storage[dataProperty], value);
		}
	};
	/**
	 * export constructor as module
	 **/
	module.Application = Application;
}(controller, $));