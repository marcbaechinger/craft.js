var controller = controller || {
    version: "0.0.1"
};

(function(module, $) {
    var ACTION_EVENT_TAG = "@", DEBUG = false, DEFAULT_CONTAINER_SELECTOR = "body", DEFAULT_SPEC = {
        actionAwareEvents: "click",
        modelValueDataAttribute: "model-val"
    }, Controller = function(spec) {
        $.extend(this, DEFAULT_SPEC, spec);
        return this;
    };
    Controller.prototype.init = function() {
        this.containerSelector = this.containerSelector || DEFAULT_CONTAINER_SELECTOR;
        if (!this.container) {
            this.container = $(this.containerSelector);
        }
        delete this.containerSelector;
        this.resolveUIElements();
        this.attachEvents();
        this.bindActionHandler();
        console.log("controller started: ", this);
        return this;
    };
    Controller.prototype.bindActionHandler = function() {
        var that = this;
        if (DEBUG) {
            console.log("bind action handler to '" + this.actionAwareEvents + "'");
        }
        this.container.bind(this.actionAwareEvents, function(e) {
            var target = $(e.target).closest("[data-action]"), actionName = target.data("action");
            if (e.type[0] === "@") {
                if (DEBUG) {
                    console.log("caught and reroute action event " + e.type, e.target, arguments[1], that);
                }
                actionName = e.type.substring(1);
            }
            if (typeof that.actions[actionName] === "function") {
                that.actions[actionName].apply(that, arguments);
                e.preventDefault();
                e.stopPropagation();
            }
        });
    };
    Controller.prototype.attachEvents = function() {
        var eventExpression, expressionTokens, eventName, selector, actionList = " ", that = this;
        this.actions = this.actions || [];
        for (eventExpression in this.events) {
            if (this.events.hasOwnProperty(eventExpression)) {
                expressionTokens = eventExpression.split(" ");
                eventName = expressionTokens.shift();
                selector = expressionTokens.join(" ");
                if (eventName[0] === ACTION_EVENT_TAG) {
                    if (DEBUG) {
                        console.log("attachEvents(" + eventExpression + ") -> register action handler " + "controller('" + this.container + "').events['" + eventExpression + "'] for action '" + eventName + "'");
                    }
                    this.actions[eventName.substring(1)] = this.events[eventExpression];
                    if (actionList.indexOf(eventName + " ") === -1) {
                        actionList += eventName + " ";
                    }
                } else {
                    if (DEBUG) {
                        console.log("attachEvents(" + eventExpression + ") -> delegate '" + eventName + "' of elements matching '" + selector + "' to controller('" + this.container + "').events['" + eventExpression + "']");
                    }
                    this.container.delegate(selector, eventName, this.createDelegator(eventExpression));
                }
            }
        }
        this.actionAwareEvents += actionList;
        if (DEBUG) {
            console.log("events to be bound to after attaching actions: '" + this.actionAwareEvents + "'");
        }
    };
    Controller.prototype.createDelegator = function(eventExpression) {
        var that = this;
        return function(e) {
            that.events[eventExpression].call(that, e);
        };
    };
    Controller.prototype.resolveUIElements = function() {
        var name, selector;
        this.$elements = this.$elements || {};
        if (this.scann === true) {
            this.scannForElements();
        }
        if (this.elementSelectors) {
            for (name in this.elementSelectors) {
                if (this.elementSelectors.hasOwnProperty(name)) {
                    selector = this.elementSelectors[name];
                    if (DEBUG) {
                        console.log("resolveUIElement(" + name + "-" + selector + ") -> attach element with selector '" + selector + "' to this.$elements." + name);
                    }
                    this.$elements[name] = this.container.find(selector);
                }
            }
        }
    };
    Controller.prototype.scannForElements = function() {
        var $elements = this.$elements, that = this;
        this.container.find("[data-" + this.modelValueDataAttribute + "]").each(function() {
            var el = $(this);
            if (DEBUG) {
                console.log("Controller.scannForElements(): found element with att 'data-" + that.modelValueDataAttribute + "'");
            }
            $elements[el.data(that.modelValueDataAttribute)] = el;
        });
    };
    module.Controller = Controller;
    module.renderer = {};
})(controller, $);

var model = model || {
    version: "1.0"
};

(function(global) {
    var Observable = function() {
        this.observerMap = {};
        return this;
    };
    Observable.prototype.unbind = function(type, callback) {
        var observers = this.observerMap[type], i;
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
    Observable.prototype.bind = function(type, callback) {
        if (!this.observerMap[type]) {
            this.observerMap[type] = [];
        }
        this.observerMap[type].unshift(callback);
        return this;
    };
    Observable.prototype.emit = function(type) {
        var i, args = Array.prototype.slice.call(arguments, 1);
        if (this.observerMap[type]) {
            for (i = 0; i < this.observerMap[type].length; i += 1) {
                this.observerMap[type][i].apply(this, args);
            }
        }
        return this;
    };
    global.Observable = Observable;
})(model);

(function(module) {
    var toString = Object.prototype.toString, arrStr = toString.call([]), isArray = function(obj) {
        return toString.call(obj) === arrStr;
    }, keyPropertyName = "id", Collection = function(spec) {
        model.Observable.call(this);
        this.init(spec);
    }, Model = function(spec) {
        model.Observable.call(this);
        this.init(spec);
    };
    Model.prototype = new model.Observable;
    Model.prototype.init = function(spec) {
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
    Model.prototype.get = function(name) {
        var val;
        if (typeof name !== "undefined") {
            return this.data[name];
        }
        return this.data;
    };
    Model.prototype.set = function(data) {
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
    Model.prototype.delete = function(data) {
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
    Model.prototype.toString = function() {
        var str = this.data.label || this.data.name || this.data.title || "model: " + this.id;
        return str;
    };
    Collection.prototype = new model.Observable;
    Collection.prototype.init = function(spec) {
        this.onChange = function(that) {
            return function(data) {
                var pos;
                for (pos = 0; pos < that.data.length; pos++) {
                    if (data.id === that.data[pos].id) {
                        that.emit("change", data, pos);
                        break;
                    }
                }
            };
        }(this);
        this.data = [];
        if (spec.data) {
            this.add(spec.data);
        }
    };
    Collection.prototype.addSingle = function(data, silent) {
        var that = this, model = new Model({
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
    Collection.prototype.add = function(data, silent) {
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
    Collection.prototype.removeSingle = function(data, silent) {
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
    Collection.prototype.empty = function() {
        return this.data.length < 1;
    };
    Collection.prototype.byId = function(id) {
        var i;
        for (i = 0; i < this.data.length; i++) {
            if (id === this.data[i].id) {
                return this.data[i];
            }
        }
        return undefined;
    };
    Collection.prototype.getPositionById = function(id) {
        var i;
        for (i = 0; i < this.data.length; i++) {
            if (id === this.data[i].id) {
                return i;
            }
        }
        return -1;
    };
    Collection.prototype.byPosition = function(pos) {
        return this.data[pos];
    };
    Collection.prototype.toString = function() {
        var buf = "[", i, start = this.data.length - 1;
        for (i = start; i >= 0; i--) {
            buf += "'" + this.data[start - i].toString() + "'";
            if (i) buf += ",";
        }
        return buf + "]";
    };
    module.Model = Model;
    module.Collection = Collection;
})(model);

(function(module, $) {
    var DEBUG = false, arrStr = Object.prototype.toString.call([]), util = {
        isArray: function(obj) {
            return Object.prototype.toString.call(obj) === arrStr;
        },
        bindThis: function(target, funct) {
            return function() {
                funct.apply(target, arguments);
            };
        }
    }, DEFAULT_SPEC = {
        collectionItemTagName: "li",
        collectionItemIdAttName: "data-ui-id",
        onModelRemove: function(model, pos) {
            if (pos > -1 && util.isArray(this.model.data)) {
                this.container.find("[" + this.collectionItemIdAttName + "=" + model.data.id + "]").remove();
            } else {
                this.render();
            }
        },
        onModelAdd: function(model, pos) {
            if (pos > -1 && util.isArray(this.model.data)) {
                this.container.append(this.renderItem(model));
            } else {
                this.render();
            }
        },
        onModelChange: function(model, pos) {
            if (pos > -1 && util.isArray(this.model.data)) {
                this.container.find("[" + this.collectionItemIdAttName + "=" + model.id + "]").replaceWith(this.renderItem(model));
            } else {
                this.render();
            }
        },
        onSelectionChange: function(model, pos) {}
    }, ModelAwareController = function(spec) {
        controller.Controller.call(this, spec);
        this.boundOnChange = util.bindThis(this, function(model, pos) {
            if (typeof this.onModelChange === "function") {
                this.onModelChange(model, pos);
            }
            this.container.trigger("@model-change", {
                model: model,
                pos: pos
            });
        });
        this.boundOnRemove = util.bindThis(this, function(model, pos) {
            if (typeof this.onModelRemove === "function") {
                this.onModelRemove(model, pos);
            }
            this.container.trigger("@model-remove", {
                model: model,
                pos: pos
            });
        });
        this.boundOnAdd = util.bindThis(this, function(model, pos) {
            if (typeof this.onModelAdd === "function") {
                this.onModelAdd(model, pos);
            }
            this.container.trigger("@model-add", {
                model: model,
                pos: pos
            });
        });
        this.boundOnSelection = util.bindThis(this, function(model, pos) {
            if (typeof this.onSelectionChange === "function") {
                this.onSelectionChange(model, pos);
            }
            this.container.trigger("@selection", {
                model: model,
                pos: pos
            });
        });
        return this;
    };
    ModelAwareController.prototype = new controller.Controller(DEFAULT_SPEC);
    ModelAwareController.prototype.init = function() {
        controller.Controller.prototype.init.apply(this, arguments);
        if (this.renderTargetSelector) {
            this.renderTarget = this.container.find(this.renderTargetSelector);
        } else {
            this.renderTarget = this.container;
        }
        this.compositeControllers = {};
        this.setModel(this.model);
        return this;
    };
    ModelAwareController.prototype.setModel = function(model) {
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
    ModelAwareController.prototype.attachToModel = function(model) {
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
    ModelAwareController.prototype.detachFromModel = function(model) {
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
    ModelAwareController.prototype.render = function() {
        var that = this, buf = "", pos = 0;
        if (util.isArray(this.model.data)) {
            $(this.model.data).each(function() {
                buf += that.renderItem(this, pos++);
            });
            this.renderTarget.html(buf);
        } else {
            this.mapDataToUI(this.model.data);
        }
    };
    ModelAwareController.prototype.renderItem = function(item) {
        return [ "<", this.collectionItemTagName, " ", this.collectionItemIdAttName, "='", item.id + "'>", "<span class='name'>", item, "</span></", this.collectionItemTagName, ">" ].join("");
    };
    ModelAwareController.prototype.mapDataToUI = function(data) {
        var name, value, el, tagName;
        for (name in this.$elements) {
            el = this.$elements[name];
            if (el.length && this.$elements.hasOwnProperty(name) && el[0].getAttribute("data-model-val")) {
                value = data[name] || "";
                tagName = el[0].tagName;
                if (util.isArray(value.data)) {
                    this.mapCollectionToUI(name, value, el);
                } else if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "HIDDEN") {
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
            renderer = listContainer.data("ui-renderer");
            if (renderer) {
                spec.renderItem = controller.renderer[renderer];
            }
            this.compositeControllers[fieldName] = (new ModelAwareController(spec)).init();
        }
    };
    module.ModelAwareController = ModelAwareController;
})(controller, $);

(function(exports) {
    exports.craftjs = exports.craftjs || {};
    exports.ALL_BUILD_FLAGS = [ "plain", "mangle", "expand", "squeeze", "beautify", "minimize", "lint" ];
    exports.LINT_OPTIONS = {
        passfail: false,
        maxerr: 1e3,
        browser: true,
        node: false,
        rhino: false,
        couch: false,
        wsh: false,
        jquery: true,
        prototypejs: false,
        mootools: false,
        dojo: false,
        debug: false,
        devel: true,
        es5: true,
        strict: false,
        globalstrict: false,
        asi: false,
        laxbreak: true,
        bitwise: true,
        boss: false,
        curly: true,
        eqeqeq: true,
        eqnull: false,
        evil: false,
        expr: false,
        forin: false,
        immed: true,
        latedef: true,
        loopfunc: false,
        noarg: true,
        regexp: true,
        regexdash: false,
        scripturl: true,
        shadow: false,
        supernew: false,
        undef: true,
        newcap: true,
        noempty: true,
        nonew: true,
        nomen: true,
        onevar: false,
        plusplus: false,
        sub: false,
        trailing: true,
        white: true,
        indent: 4
    };
    exports.LINT_DESC = {
        passfail: "Stop on first error",
        maxerr: "Maximum error before stopping",
        browser: "Standard browser globals e.g. `window`, `document`",
        node: "Allow globals of node.js",
        rhino: "Allow globals of rhino",
        couch: "Allow globals of couch DB",
        wsh: "Allow globals of Windows Scripting Host",
        jquery: "allow jquery",
        prototypejs: "allow prototypejs",
        mootools: "allow mootools",
        dojo: "allow dojo",
        predef: "Custom globals",
        debug: "Allow debugger statements e.g. browser breakpoints",
        devel: "Allow developments statements e.g. `console.log();`",
        es5: "Allow ECMAScript 5 syntax",
        strict: "Require `use strict` pragma in every file",
        globalstrict: "Allow global 'use strict' (also enables 'strict')",
        asi: "Tolerate Automatic Semicolon Insertion (no semicolons)",
        laxbreak: "Tolerate unsafe line breaks e.g. `return [\n] x` without semicolons",
        bitwise: "Prohibit bitwise operators (&, |, ^, etc.)",
        boss: "Tolerate assignments inside if, for & while. Usually conditions & loops are for comparison, not assignments",
        curly: "Require {} for every new block or scope",
        eqeqeq: "Require triple equals i.e. `===`",
        eqnull: "Tolerate use of `== null`",
        evil: "Tolerate use of `eval`",
        expr: "Tolerate `ExpressionStatement` as Programs",
        forin: "Tolerate `for in` loops without `hasOwnPrototype`",
        immed: "Require immediate invocations to be wrapped in parens e.g. `( function (){}() );`",
        latedef: "Prohipit variable use before definition",
        loopfunc: "Allow functions to be defined within loops",
        noarg: "Prohibit use of `arguments.caller` and `arguments.callee`",
        regexp: "Prohibit `.` and `[^...]` in regular expressions",
        regexdash: "Tolerate unescaped last dash i.e. `[-...]`",
        scripturl: "Tolerate script-targeted URLs",
        shadow: "Allows re-define variables later in code e.g. `var x=1; x=2;`",
        supernew: "Tolerate `new function () { ... };` and `new Object;`",
        undef: "Require all non-global variables be declared before they are used",
        newcap: "Require capitalization of all constructor functions e.g. `new F()`",
        noempty: "Prohibit use of empty blocks",
        nonew: "Prohibit use of constructors for side-effects",
        nomen: "Prohibit use of initial or trailing underbars in names",
        onevar: "Allow only one `var` statement per function",
        plusplus: "Prohibit use of `++` & `--`",
        sub: "Tolerate all forms of subscript notation besides dot notation e.g. `dict['key']` instead of `dict.key`",
        trailing: "Prohibit trailing whitespaces",
        white: "Check against strict whitespace and indentation rules",
        indent: "Specify indentation spacing"
    };
})(this);

(function(exports, $) {
    exports.craftjs.services = exports.craftjs.services || {};
    exports.craftjs.services.storeJob = function(job, callback) {
        $.ajax("/jobs", {
            type: "PUT",
            data: JSON.stringify(job),
            dataType: "json",
            contentType: "application/json",
            success: function(jsonData) {
                if (callback) {
                    callback(jsonData);
                }
            }
        });
    };
    exports.craftjs.services.release = function(job, callback) {
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
            success: function(res) {
                if (callback) {
                    callback(res);
                } else {
                    console.log("res", res);
                    document.location = "/" + craftjs.data.dist + "/" + res.path;
                }
            }
        });
    };
    exports.craftjs.services.deleteRelease = function(path, callback) {
        $.ajax("/project/build" + path, {
            type: "DELETE",
            dataType: "json",
            contentType: "application/json",
            success: function(jsonData) {
                if (callback && jsonData.status === "OK") {
                    callback();
                }
            }
        });
    };
    exports.craftjs.services.sendConfiguration = function(configuration, callback) {
        $.ajax("/config", {
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify(configuration),
            success: function(jsonData) {
                if (callback && jsonData.status === "ok") {
                    callback();
                }
            }
        });
    };
    exports.craftjs.services.deleteFile = function(path, callback) {
        $.ajax("/" + craftjs.data.context + "/" + path, {
            type: "DELETE",
            dataType: "json",
            contentType: "application/json",
            success: function(jsonData) {
                if (callback && jsonData.status === "OK") {
                    callback();
                }
            }
        });
    };
    exports.craftjs.services.phantomTest = function(path, callback, errorhandler) {
        $.ajax({
            url: path,
            contentType: "application/json",
            success: callback,
            error: errorhandler
        });
    };
})(this, jQuery);

var Mustache = typeof module !== "undefined" && module.exports || {};

(function(exports) {
    exports.name = "mustache.js";
    exports.version = "0.5.0-dev";
    exports.tags = [ "{{", "}}" ];
    exports.parse = parse;
    exports.compile = compile;
    exports.render = render;
    exports.clearCache = clearCache;
    exports.to_html = function(template, view, partials, send) {
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
        isArray = function(obj) {
            return _toString.call(obj) === "[object Array]";
        };
    }
    var forEach;
    if (_forEach) {
        forEach = function(obj, callback, scope) {
            return _forEach.call(obj, callback, scope);
        };
    } else {
        forEach = function(obj, callback, scope) {
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
        trim = function(string) {
            return string == null ? "" : _trim.call(string);
        };
    } else {
        var trimLeft, trimRight;
        if (isWhitespace(" ")) {
            trimLeft = /^\s+/;
            trimRight = /\s+$/;
        } else {
            trimLeft = /^[\s\xA0]+/;
            trimRight = /[\s\xA0]+$/;
        }
        trim = function(string) {
            return string == null ? "" : String(string).replace(trimLeft, "").replace(trimRight, "");
        };
    }
    var escapeMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };
    function escapeHTML(string) {
        return String(string).replace(/&(?!\w+;)|[<>"']/g, function(s) {
            return escapeMap[s] || s;
        });
    }
    function debug(e, template, line, file) {
        file = file || "<template>";
        var lines = template.split("\n"), start = Math.max(line - 3, 0), end = Math.min(lines.length, line + 3), context = lines.slice(start, end);
        var c;
        for (var i = 0, len = context.length; i < len; ++i) {
            c = i + start + 1;
            context[i] = (c === line ? " >> " : "    ") + context[i];
        }
        e.template = template;
        e.line = line;
        e.file = file;
        e.message = [ file + ":" + line, context.join("\n"), "", e.message ].join("\n");
        return e;
    }
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
        if (typeof value === "function") {
            value = value.call(localStack[localStack.length - 1]);
        }
        if (value == null) {
            return defaultValue;
        }
        return value;
    }
    function renderSection(name, stack, callback, inverted) {
        var buffer = "";
        var value = lookup(name, stack);
        if (inverted) {
            if (value == null || value === false || isArray(value) && value.length === 0) {
                buffer += callback();
            }
        } else if (isArray(value)) {
            forEach(value, function(value) {
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
            var scopedRender = function(template) {
                return render(template, scope);
            };
            buffer += value.call(scope, callback(), scopedRender) || "";
        } else if (value) {
            buffer += callback();
        }
        return buffer;
    }
    function parse(template, options) {
        options = options || {};
        var tags = options.tags || exports.tags, openTag = tags[0], closeTag = tags[tags.length - 1];
        var code = [ 'var buffer = "";', "\nvar line = 1;", "\ntry {", '\nbuffer += "' ];
        var spaces = [], hasTag = false, nonSpace = false;
        var stripSpace = function() {
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
        var setTags = function(source) {
            tags = trim(source).split(/\s+/);
            nextOpenTag = tags[0];
            nextCloseTag = tags[tags.length - 1];
        };
        var includePartial = function(source) {
            code.push('";', updateLine, '\nvar partial = partials["' + trim(source) + '"];', "\nif (partial) {", "\n  buffer += render(partial,stack[stack.length - 1],partials);", "\n}", '\nbuffer += "');
        };
        var openSection = function(source, inverted) {
            var name = trim(source);
            if (name === "") {
                throw debug(new Error("Section name may not be empty"), template, line, options.file);
            }
            sectionStack.push({
                name: name,
                inverted: inverted
            });
            code.push('";', updateLine, '\nvar name = "' + name + '";', "\nvar callback = (function () {", "\n  return function () {", '\n    var buffer = "";', '\nbuffer += "');
        };
        var openInvertedSection = function(source) {
            openSection(source, true);
        };
        var closeSection = function(source) {
            var name = trim(source);
            var openName = sectionStack.length != 0 && sectionStack[sectionStack.length - 1].name;
            if (!openName || name != openName) {
                throw debug(new Error('Section named "' + name + '" was never opened'), template, line, options.file);
            }
            var section = sectionStack.pop();
            code.push('";', "\n    return buffer;", "\n  };", "\n})();");
            if (section.inverted) {
                code.push("\nbuffer += renderSection(name,stack,callback,true);");
            } else {
                code.push("\nbuffer += renderSection(name,stack,callback);");
            }
            code.push('\nbuffer += "');
        };
        var sendPlain = function(source) {
            code.push('";', updateLine, '\nbuffer += lookup("' + trim(source) + '",stack,"");', '\nbuffer += "');
        };
        var sendEscaped = function(source) {
            code.push('";', updateLine, '\nbuffer += escapeHTML(lookup("' + trim(source) + '",stack,""));', '\nbuffer += "');
        };
        var line = 1, c, callback;
        for (var i = 0, len = template.length; i < len; ++i) {
            if (template.slice(i, i + openTag.length) === openTag) {
                i += openTag.length;
                c = template.substr(i, 1);
                updateLine = "\nline = " + line + ";";
                nextOpenTag = openTag;
                nextCloseTag = closeTag;
                hasTag = true;
                switch (c) {
                  case "!":
                    i++;
                    callback = null;
                    break;
                  case "=":
                    i++;
                    closeTag = "=" + closeTag;
                    callback = setTags;
                    break;
                  case ">":
                    i++;
                    callback = includePartial;
                    break;
                  case "#":
                    i++;
                    callback = openSection;
                    break;
                  case "^":
                    i++;
                    callback = openInvertedSection;
                    break;
                  case "/":
                    i++;
                    callback = closeSection;
                    break;
                  case "{":
                    closeTag = "}" + closeTag;
                  case "&":
                    i++;
                    nonSpace = true;
                    callback = sendPlain;
                    break;
                  default:
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
                    break;
                  case "\n":
                    spaces.push(code.length);
                    code.push("\\n");
                    stripSpace();
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
        stripSpace();
        code.push('";', "\nreturn buffer;", "\n} catch (e) { throw {error: e, line: line}; }");
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
    function _compile(template, options) {
        var args = "view,partials,stack,lookup,escapeHTML,renderSection,render";
        var body = parse(template, options);
        var fn = new Function(args, body);
        return function(view, partials) {
            partials = partials || {};
            var stack = [ view ];
            try {
                return fn(view, partials, stack, lookup, escapeHTML, renderSection, render);
            } catch (e) {
                throw debug(e.error, template, e.line, options.file);
            }
        };
    }
    var _cache = {};
    function clearCache() {
        _cache = {};
    }
    function compile(template, options) {
        options = options || {};
        if (options.cache !== false) {
            if (!_cache[template]) {
                _cache[template] = _compile(template, options);
            }
            return _cache[template];
        }
        return _compile(template, options);
    }
    function render(template, view, partials) {
        return compile(template)(view, partials);
    }
})(Mustache);

(function(exports) {
    var templateCache = {};
    exports.craftjs.render = function(template, renderData) {
        return Mustache.render(template, renderData);
    };
    exports.craftjs.renderById = function(templateId, renderData) {
        if (!templateCache[templateId]) {
            templateCache[templateId] = $("#" + templateId).text();
        }
        return Mustache.render(templateCache[templateId], renderData);
    };
})(typeof global === "undefined" ? this : global);

(function(exports, $) {
    var PageController = function PageController(model, buildFlagProvider) {
        return new controller.ModelAwareController({
            path: craftjs.data.path,
            model: model,
            elementSelectors: {
                buttons: ".bag-button",
                projectLabel: ".project-name",
                runAllTestsButton: ".all-tests"
            },
            events: {
                "@nav": function(e) {
                    var target = $(e.target), path = target.data("path");
                    if (path) {
                        document.location = path;
                    }
                },
                "@toggle-file-to-job": function() {
                    var slice = {};
                    slice[craftjs.data.path] = {};
                    if (this.model.data[craftjs.data.path]) {
                        this.model.delete(slice);
                    } else {
                        this.model.set(slice);
                    }
                },
                "@delete-file": function(e) {
                    var target = $(e.target), path = target.data("path");
                    if (path) {
                        craftjs.services.deleteFile(path, function() {
                            target.closest("li").remove();
                        });
                    }
                },
                "@toggle-source-markers": function() {
                    var markerPattern = /^[ \d]*:.*\/\/.*(FIXME|TODO)/, buf = [], markerList = $("#markers");
                    markerList.empty();
                    $(".source pre").each(function() {
                        var line = $(this), txt = line.text(), convert, fixme;
                        if (txt.match(markerPattern)) {
                            line.toggleClass("marker");
                            if (line.hasClass("marker")) {
                                convert = txt.replace(/\/\//, "");
                                fixme = convert.indexOf("FIXME") > -1;
                                convert = convert.replace(/FIXME/, "");
                                convert = convert.replace(/TODO/, "");
                                buf.push("<li><a href='#" + line.data("id") + "' class='" + (fixme ? "fixme" : "todo") + "'>" + (fixme ? "FIXME" : "TODO") + "</a> line " + convert + "</li>");
                            }
                        }
                    });
                    if (buf.length < 1) {
                        $(".marker-button").text("no TODOs/FIXMEs found");
                    } else {
                        $(".marker-button").remove();
                    }
                    markerList.html(buf.join(""));
                },
                "@build": function(e) {
                    var target = $(e.target), path = target.data("path"), query = buildFlagProvider(ALL_BUILD_FLAGS, target.closest("li"));
                    document.location = "/" + craftjs.data.context + "/" + path + query;
                },
                "@build-job": function(e) {
                    var target = $(e.target), path = target.data("path"), query = buildFlagProvider(ALL_BUILD_FLAGS, target.closest("li"));
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
                "@send-configuration": function(e) {
                    var resourcePathInput = $("#resource-path"), path = resourcePathInput.val();
                    if (path.trim().length < 1) {
                        $("#configuration .feedback").text("enter a path to the directory where your javascripts are").show();
                    } else {
                        craftjs.services.sendConfiguration({
                            path: path
                        }, function() {
                            resourcePathInput.attr("disabled", "true");
                            $("#configuration .feedback").text("resource directory points now to '" + path + "'").show();
                        });
                    }
                },
                "@show-html": function(e) {
                    alert("action page-controller@show-html not implemented yet");
                },
                "@create-test": function(e) {},
                "@remove-from-project": function(e) {
                    var target = $(e.target), path = target.data("path"), slice = {};
                    slice[path] = {};
                    this.model.delete(slice);
                },
                "@edit-project-name": function(e) {
                    var name = prompt("Project name", localStorage.projectName);
                    if (name) {
                        localStorage.projectName = name;
                        this.render();
                    }
                    e.stopPropagation();
                },
                "@show-test-report": function(e) {
                    var target = $(e.target);
                    target.next().toggle();
                },
                "@test-phantom-all": function(e) {
                    $("[data-action='test-phantom']").trigger("click");
                },
                "@test-phantom": function(e) {
                    var target = $(e.target).closest("a"), href = target.attr("href"), statusLabel = target.parent().find(".status-label");
                    target.parent().find(".qunit-report").remove();
                    $(".qunit-report").hide();
                    if (statusLabel.length < 1) {
                        statusLabel = $("<span data-action='show-test-report' class='status-label label label-warning'>Phantom test running...</span>");
                        statusLabel.insertBefore(target);
                    } else {
                        statusLabel.text("phantomjs test running...").removeClass("label-important").removeClass("label-success").addClass("label-warning");
                    }
                    craftjs.services.phantomTest(href, function(testReport) {
                        console.log(testReport);
                        var template = $("#phantom-test-report").text();
                        content = Mustache.render(template, testReport);
                        if (testReport.failed > 0) {
                            statusLabel.text("phantomjs test failed").removeClass("label-warning").addClass("label-important");
                        } else {
                            statusLabel.text("phantomjs test succeeded").removeClass("label-warning").addClass("label-success");
                        }
                        $(content).insertAfter(statusLabel);
                    }, function(err) {
                        alert("phantom testing of " + href + " failed: " + e.message);
                    });
                    e.stopPropagation();
                },
                "click .collapser": function(e) {
                    var target = $(e.target), referenceElement, dependent = target.data("dependent"), slide = target.data("slide");
                    if (dependent) {
                        referenceElement = $(dependent);
                    } else if (target.hasClass("collapser")) {
                        referenceElement = target.next();
                    }
                    if (referenceElement && slide) {
                        referenceElement.slideToggle();
                    } else if (referenceElement) {
                        referenceElement.toggle();
                    }
                }
            },
            render: function() {
                var that = this;
                this.$elements.projectLabel.text(localStorage.projectName);
                if (this.model.data[this.path]) {
                    this.$elements.buttons.addClass("contained").text("remove from Favorites");
                } else {
                    this.$elements.buttons.removeClass("contained").text("add to Favorites");
                }
                $("[data-action='test-phantom']").each(function() {
                    that.$elements.runAllTestsButton.show();
                    return false;
                });
            }
        });
    };
    exports.craftjs.PageController = PageController;
})(this, jQuery);

(function(exports, $) {
    var buildSingleFile = function(path, transformationFlags) {
        var files = {}, projectName = prompt("Name of this release");
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
    }, ToolbarController = function ToolbarController(containerId, model, buildFlagsProvider) {
        var transformationFlags = [ "mangle", "expand", "squeeze", "minimize", "beautify" ];
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
                "@build": function(e) {
                    var target = $(e.target), path = target.data("path"), query = buildFlagsProvider(ALL_BUILD_FLAGS, this.container);
                    if (this.$elements.release.attr("checked")) {
                        buildSingleFile(craftjs.data.path, this.getTransformationFlags());
                    } else if (path) {
                        document.location = "/" + craftjs.data.context + "/" + path + query;
                    }
                }
            },
            getTransformationFlags: function() {
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
})(this, jQuery);

(function(exports, $) {
    var filterBooleanLintOptions = function(options) {
        return $.map(options, function(val, key) {
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
    }, renderLintOptions = function(options, title) {
        return craftjs.renderById("lint-options-tmpl", {
            options: filterBooleanLintOptions(options),
            maxerr: options.maxerr,
            indent: options.indent,
            title: title
        });
    }, LintController = function LintController(containerId, model) {
        return new controller.ModelAwareController({
            model: model,
            containerSelector: containerId,
            events: {
                "click label": function(e) {
                    var target = $(e.target), name = target.data("name"), slice = {};
                    slice[name] = !this.model.data[name];
                    this.model.set(slice);
                },
                "@edit-maxerr": function() {
                    var maxerr = prompt("max number of errors", this.model.get("maxerr"));
                    if (maxerr) {
                        this.model.set({
                            maxerr: maxerr
                        });
                    }
                },
                "@edit-indent": function() {
                    var indent = prompt("number of spaces", this.model.get("indent"));
                    if (indent) {
                        this.model.set({
                            indent: indent
                        });
                    }
                }
            },
            render: function() {
                var buf = [];
                buf.push(renderLintOptions(this.model.data, "JSHint options"));
                this.container.html(buf.join(""));
            },
            toQueryString: function() {
                var buf = "";
                $.each(this.model.data, function(key, val) {
                    buf += "lint-" + key + "=" + val + "&";
                });
                return buf;
            }
        });
    };
    exports.craftjs.LintController = LintController;
})(this, jQuery);

(function(exports, $) {
    var renderCheckBox = function(name) {
        return craftjs.render("<label><span class='label label-warning'>{{name}}<input type='checkbox' name='{{name}}'/></span></label>", {
            name: name
        });
    }, renderProjectItem = function(path) {
        return craftjs.renderById("project-file", {
            path: path
        });
    }, JobPanelController = function JobPanelController(containerId, model) {
        return new controller.ModelAwareController({
            model: model,
            containerSelector: containerId,
            events: {
                "@build-project": function() {
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
                "@save-job": function() {
                    if (!this.isEmpty()) {
                        craftjs.services.storeJob({
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
            render: function() {
                var buf = [ "<div class='build-flags'>" ];
                buf.push($.map([ "mangle", "squeeze", "minimize", "beautify" ], renderCheckBox).join(""));
                buf.push("<button class='btn btn-primary btn-mini build' data-action='build-project'");
                if (this.isEmpty()) {
                    buf.push(" disabled='disabled'");
                }
                buf.push(">build</button><button data-action='save-job' class='btn btn-primary btn-mini build'>save</button></div><ul>");
                $.each(this.model.data, function(key) {
                    buf.push(renderProjectItem(key));
                });
                buf.push("</ul>");
                this.container.html(buf.join(""));
            },
            isEmpty: function() {
                var path;
                for (path in this.model.data) {
                    if (this.model.data.hasOwnProperty(path)) {
                        return false;
                    }
                }
                return true;
            },
            getTransformFlags: function() {
                var flags = {}, that = this;
                $.each([ "mangle", "squeeze", "beautify", "minimize" ], function() {
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
})(this, jQuery);

(function(exports, $) {
    var SearchController = function(inputId, scriptContainerId, resultContainerId) {
        var input = $("#" + inputId), block = "block", hide = "none", scriptContainer = $("#" + scriptContainerId), resultContainer = $("#" + resultContainerId), lineElements = scriptContainer.find(".line"), lines = lineElements.map(function() {
            return this.style;
        }), textLines = lineElements.map(function() {
            return $(this).text().replace(/^\d*:\t/, "");
        }), showAllLines = function() {
            $.each(lines, function(idx) {
                lines[idx].display = "block";
            });
        }, displayResultInfo = function(matchCount, searchExpr) {
            if (matchCount < 1) {
                resultContainer.html("no matches found for <code>/" + searchExpr + "/</code>");
                showAllLines();
            } else {
                resultContainer.html(matchCount + " matches found for <code>/" + searchExpr + "/</code>");
            }
        };
        lineElements = undefined;
        input.bind("change", function() {
            var matchCount = 0, textExpr = input.val(), expr;
            try {
                expr = new RegExp(textExpr, "ig");
                if (textExpr) {
                    textLines.each(function(idx) {
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
})(this, jQuery);

$(function() {
    var bag, projectModel, lintOptions, lintModel, pageController, buildToolbarController, projectPanelController, lintOptionPanelController, searchController, getBag = function() {
        var storageValue;
        if (!bag) {
            storageValue = localStorage.bag;
            bag = storageValue ? JSON.parse(storageValue) : {};
        }
        return bag;
    }, saveBag = function() {
        localStorage.bag = JSON.stringify(bag);
    }, getLintOptions = function() {
        var storageValue;
        if (!lintOptions) {
            storageValue = localStorage.lintOptions;
            lintOptions = storageValue ? JSON.parse(storageValue) : LINT_OPTIONS;
        }
        return lintOptions;
    }, saveLintOptions = function() {
        localStorage.lintOptions = JSON.stringify(lintModel.data);
    }, getBuildFlags = function(flags, container) {
        var query = "?";
        $.each(flags, function() {
            if (container.find("[name='" + this + "']").attr("checked")) {
                query += this + "=true&";
            }
        });
        if (container.find("[name='lint']").attr("checked")) {
            query += lintOptionPanelController.toQueryString();
        }
        return query;
    };
    if (!localStorage.projectName) {
        localStorage.projectName = "default";
    }
    projectModel = (new model.Model({
        data: getBag()
    })).bind("change", saveBag).bind("remove", saveBag);
    lintModel = (new model.Model({
        data: getLintOptions()
    })).bind("change", saveLintOptions);
    lintOptionPanelController = (new craftjs.LintController("#lint-options", lintModel)).init();
    buildToolbarController = (new craftjs.ToolbarController("#build-toolbar", new model.Model({
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
    }), getBuildFlags)).init();
    projectPanelController = (new craftjs.JobPanelController("#project-files", projectModel)).init();
    pageController = (new craftjs.PageController(projectModel, getBuildFlags)).init();
    searchController = new craftjs.SearchController("search-script", "source", "result-info");
});