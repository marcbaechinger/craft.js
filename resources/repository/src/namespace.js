/*global */
/*jslint browser: true */
(function (global) {
	
	var createNamespace = function (name, path) {
			return {
				ns: {
					name: name,
					path: path
				}
			};
		},
		copyProperties = function (target, mixin, override) {
			var name;
			for (name in mixin) {
				if (mixin.hasOwnProperty(name)) {
					if (target[name] && override) {
						target[name] = mixin[name];
					} else if (!target[name]) {
						target[name] = mixin[name];
					}
				}
			}
		};
	
	global.namespace = function (namespace, mixin, override) {
		var stack = namespace.split("."),
			i,
			name,
			parent = global,
			path = "";
			
		for (i = 0; i < stack.length; i++) {
			name = stack[i];
			path += name;
			if (!parent[name]) {
				parent[name] = createNamespace(name, path);
			}
			path += ".";
			parent = parent[name];
		}
		
		if (mixin) {
			copyProperties(parent, mixin, !(override === false));
		}
		return parent;
	};
}(this));