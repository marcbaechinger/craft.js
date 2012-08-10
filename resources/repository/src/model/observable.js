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