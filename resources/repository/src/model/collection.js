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

