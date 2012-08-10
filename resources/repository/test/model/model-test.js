var main = function() {    
    module("model basics");
    test("create a model", function(){
    	var user = new model.Model({
				data: {id: 1}
			});
		
		equal(typeof user.bind , "function", "function bind inherited from Observable");
		equal(typeof user.unbind , "function", "function unbind inherited from Observable");
		equal(typeof user.emit, "function", "function emit inherited from Observable");
		
		equal(user.data.id, 1, "initial data set");	
		equal(user.id, 1, "data id propagated to model");
	});
	
    test("test model getter", function(){
    	var data = {id: 1, name: "Marc"},
			user = new model.Model({
				data: data
			});
			
		equal(user.get("id"), 1, "get id by getter");	
		equal(user.get("name"), "Marc", "get name by getter");
		equal(user.get(), data, "get full data by getter");
	});
	
    test("test model setter", function(){
    	var user = new model.Model({
				data: {id: 1}
			});
			
		equal(user.data.id, 1, "initial data set");
		equal(user.id, 1, "initial data set");
		user.set({
			id: 2,
			name: "Marc"
		});
		equal(user.data.name, "Marc", "added property by update");
		equal(user.data.id, 1, "updated id not allowed");
		equal(user.id, 1, "updated id not allowed");
	});
	
	
    test("test deleting properties from a model", function(){
    	var user = new model.Model({
				data: {id: 1, name: "Marc"}
			});
			
		equal(user.data.id, 1, "initial data set");
		
		user.delete({name: "", id: ""});
		equal(typeof user.data.name, "undefined", "name has been deleted");	
		equal(user.data.id, 1, "id can't be deleted");
	});
	
	module("change listener");
	
    test("test update listener (set)", function(){
    	var listenerCalled = false,
			updateData = {name: "Hans"},
			user = new model.Model({
				data: {id: 1, name: "Marc"}
			});
		
		user.bind("change", function(model) {
			listenerCalled = true;
			equal(model.data, user.data, "updated date meets expectations");
		});
		user.set(updateData);
		ok(listenerCalled, "set listener has been called");
	});
	
    test("test delete listener (set)", function(){
    	var listenerCalled = false,
			deleteData = {id: 1, name: ""},
			assertData = {id: 1},
			user = new model.Model({
				data: {id: 1, name: "Marc"}
			});
		
		user.bind("remove", function(model) {
			listenerCalled = true;
			deepEqual(model.data, assertData, "data passed to delete listener matches expectations");
		});
		user.delete(deleteData);
		ok(listenerCalled, "delete listener has been called");
	});
	
	
	module("array conversion");
    test("test converting array fields to model.Collection", function(){
    	var counter = 0,
			modelData = {
				id: 1, 
				name: "Rocky 4",
				actors: [
					{id: 1, name: "Stallone"},
					{id: 2, name: "Creed"},
					{id: 3, name: "Lundgren"}
				]
			},
			m = new model.Model({
				data: modelData
			});
			
			console.log("converted", Object.prototype.toString.apply({}));
		equal(m.data.name, "Rocky 4", "simple string value available");	
		equal(m.data.actors.data[0].data.name, "Stallone", "array field has been converted to collection model");
	});
	
	
    test("test converting nested arrays fields to model.Collection", function(){
    	var counter = 0,
			modelData = {
				id: 1, 
				name: "Rocky 4",
				actors: [
					{
						id: 1, 
						name: "Stallone",
						awards: [
							{id: 12, name: "4 Star"},
							{id: 13, name: "5 Star"}
						]
					},
					{id: 2, name: "Creed"},
					{id: 3, name: "Lundgren"}
				]
			},
			m = new model.Model({
				data: modelData
			});
			
		equal(m.get("actors").byId(1).get("awards").byId(12).get("name"), "4 Star", "array field has been converted to collection model");
		// the same with 'data' accessor 
		equal(m.data.actors.byId(1).data.awards.byId(12).data.name, "4 Star", "array field has been converted to collection model");
		
	});
	
	
    test("test converting array fields with primitive arrays", function(){
    	var counter = 0,
			modelData = {
				id: 1, 
				name: "Rocky 4",
				actors: [
					"a", "b", "c"
				]
			},
			m = new model.Model({
				data: modelData
			});
			
		equal(m.data.name, "Rocky 4", "simple string value available");	
		equal(m.data.actors[2], "c", "array field of primitives has NOT been converted to collection model");	
		equal(m.data.actors.length, 3, "array field of primitives has NOT been converted to collection model");
	});
	
	test("test setting array fields", function(){
		var arrData = [
				{id: 1, name: "a"},
				{id: 2, name: "b"},
				{id: 3, name: "c"},
			],
			modelData = {
				id: 1, 
				name: "Rocky 4",
				actors: arrData
			},
			updateData = {
				actors: [
					{id: 11, name: "aa"},
					{id: 12, name: "bb"},
					{id: 13, name: "cc"},
				]
			},
			mod = new model.Model({
				data: modelData
			}),
			toString = Object.prototype.toString;
		
			
		equal(mod.data.actors, modelData.actors, "initial array converted to collection");
		equal(toString.apply(mod.data.actors), "[object Object]", "expectation");
		mod.set(updateData);
		equal(mod.data.actors.data[0].data.name, "aa", "array field set correctly");
		equal(toString.apply(mod.data.actors), "[object Object]", "actors is still a collection");
		
	});
};