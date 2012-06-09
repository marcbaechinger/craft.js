/*global module: false, test: false, expect: false, equal: false, deepEqual: false, Mock: false */
var main = function () {
    module("mock library");
    test("create a mock", function () {
		var name = "mockName",
			mock = new Mock(name);

		expect(2);
		equal(name, mock.name, "name property matches expectation after creation");
		equal(0, mock.expectations.length, "empty array of expections after creation mets expectations");
	});

    test("define an expectation", function () {
		var mock = new Mock("mockName"),
			firstCallArguments = [1, 2];

		mock.expect("getName", firstCallArguments[0], firstCallArguments[1]);

		expect(3);

		equal(typeof mock.getName, "function", "the expected function has been created");
		equal(1, mock.expectations.length, "expectation array length matches expectation");
		deepEqual(firstCallArguments, mock.expectations[0].expectedArguments[0],
				"expected arguments matches expectations");
	});

    test("define multiple expectations for many functions", function () {
		var mock = new Mock("mockName"),
			firstCallArguments = [1, 2],
			secondCallArguments = [3, 4];

		mock.expect("getName", firstCallArguments[0], firstCallArguments[1]);
		mock.expect("getLastName", secondCallArguments[0], secondCallArguments[1]);

		expect(5);

		equal(2, mock.expectations.length, "expectation array length matches expectation");

		equal(typeof mock.getName, "function", "the expected function has been created");
		equal(typeof mock.getLastName, "function", "the expected function has been created");

		deepEqual(firstCallArguments, mock.expectations[0].expectedArguments[0],
			"expected arguments matches expectations");
		deepEqual(secondCallArguments, mock.expectations[1].expectedArguments[0],
			"expected arguments matches expectations");
	});

    test("define multiple expectations for the same function", function () {
		var mock = new Mock("mockName"),
			firstCallArguments = [1, 2],
			secondCallArguments = [3, 4];

		mock.expect("getName", firstCallArguments[0], firstCallArguments[1]);
		mock.expect("getName", secondCallArguments[0], secondCallArguments[1]);

		expect(4);

		equal(1, mock.expectations.length, "expectation array length matches expectation");
		equal(typeof mock.getName, "function", "the expected function has been created");
		deepEqual(firstCallArguments, mock.expectations[0].expectedArguments[0],
			"expected arguments matches expectations");
		deepEqual(secondCallArguments, mock.expectations[0].expectedArguments[1],
			"expected arguments matches expectations");
	});



    test("define exepcted function call and return value", function () {
		var mock = new Mock("mockName"),
			firstCallArguments = [1, 2],
			name = "name";

		mock.expect("getName", firstCallArguments[0], firstCallArguments[1]).andReturn(name);
		expect(1);

		equal(name, mock.getName(), "mock returned correct return value on call");
	});

    test("define different return values for multiple calls on same function", function () {
		var mock = new Mock("mockName"),
			firstCallArguments = [1, 2],
			name = "name",
			name2 = "name2";
		
		mock.expect("getName", firstCallArguments[0], firstCallArguments[1]).andReturn(name);
		mock.expect("getName", firstCallArguments[0], firstCallArguments[1]).andReturn(name2);

		expect(2);
		equal(mock.getName(), name, "mock returned correct return value on first call");
		equal(mock.getName(), name2, "mock returned correct return value on second call");
	});
};