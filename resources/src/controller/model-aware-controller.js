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
			
				// TODO a fixme
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
				// FIXME a fixme 
				this.container.trigger("@model-add", {model: model, pos: pos});
			});
			
			// FIXME a fixme
			// make sure to call this.onSelectionChange always in the context of this
			this.boundOnSelection = util.bindThis(this, function (model, pos) {
				if (typeof this.onSelectionChange === "function") {
					this.onSelectionChange(model, pos);
				} 
				this.container.trigger("@selection", {model: model, pos: pos});
			});
			
			// TODO a fixme
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