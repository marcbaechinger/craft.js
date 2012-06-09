(function (exports) {
	var Mock = function(name) {
		this.name = name;
		this.expectations = [];
		return this;
	},
	contextMock = {
		console: console,
		global: {}
	};

	Mock.type = { func: 1, prop: 2 };

	/**
	 * declares an expected function call.
	 */
	Mock.prototype.expect = function(functionName) {
	
		var expectation = this.createExpectation(functionName);
		expectation.expectedArguments.push(Array.prototype.slice.call(arguments, 1));
		expectation.expectedCount += 1;
	
		this[functionName] = this[functionName] || function() {
			var args = Array.prototype.slice.call(arguments, 0);
			expectation.capturedArguments.push(args);
			console.log("mocked func", expectation.capturedArguments);
			expectation.capturedCount += 1;
		
			return expectation.returnValues[expectation.capturedCount-1];
		};
	
		return this;
	};
	
	Mock.prototype.andReturn = function(returnValue) {
		this.expectations[this.expectations.length -1].returnValues.push(returnValue);
		return this;
	};
	Mock.prototype.times = function(numberOfCalls) {
		this.expectations[this.expectations.length -1].expectedCount += numberOfCalls - 1;
		return this;
	};


	Mock.prototype.createExpectation = function(functionName) {
		var i, expectation;
		for (i=0; i < this.expectations.length; i++) {
			if (this.expectations[i].type === Mock.type.func && this.expectations[i].name === functionName) {
				return this.expectations[i]; 
			}
		}
	
		expectation = {
			name: functionName,
			type: Mock.type.func,
			capturedCount: 0,
			expectedCount: 0,
			capturedArguments: [],
			expectedArguments: [],
			returnValues: []
		};
		this.expectations.push(expectation);
		return expectation;
	};

	Mock.prototype.getExpectationByName = function(name) {
		var i;
		for (i=0; i < this.expectations.length; i++) {
			if (this.expectations[i].type === Mock.type.func && this.expectations[i].name === name) {
				return this.expectations[i]; 
			}
		}
		return undefined;
	};



	// FIXME much too complex
	Mock.prototype.verify = function() {
		var i, exp, failures = [];
		for (i=0; i < this.expectations.length; i++) {
			exp = this.expectations[i];
			failures = failures.concat(this.verifyCallCounter(exp));
			if (failures.length < 1) {
				failures = failures.concat(this.verifyArguments(exp));
			}
		}
		return failures;
	};

	Mock.prototype.verifyArguments = function(exp) {
		var i,
			failures = [],
			expectArgs,
			capturedArgs;
		
		console.log(">->->->", exp.expectedArguments.length);
		for (i=0; i < exp.expectedArguments.length; i++) {
			expectArgs = exp.expectedArguments[i];
			capturedArgs = exp.capturedArguments[i];
			failures = failures.concat(this.verifyNumberOfArguments(exp.name, expectArgs, capturedArgs, i));
			failures = failures.concat(this.verifyValuesOfArguments(exp.name, expectArgs, capturedArgs, i));
		}	
		return failures;
	};

	Mock.prototype.verifyNumberOfArguments = function(functionName, expectedArguments, capturedArguments, callPos) {
		var failures = [];
		if (expectedArguments.length !== capturedArguments.length) {
			failures.push({
				msg: "number of arguments do not match",
				name: functionName,
				expected: expectedArguments.length,
				captured: capturedArguments.length,
				callPos: callPos
			});
		}
		return failures;
	};

	Mock.prototype.verifyValuesOfArguments = function(functionName, expectedArguments, capturedArguments, callPos) {
		var failures = [],
			i;
		for (i=0; i < expectedArguments.length; i++) {
			if (expectedArguments[i] != capturedArguments[i]) {
				failures.push({
					msg: "values of arguments do not match",
					name: functionName,
					expected: expectedArguments[i],
					captured: capturedArguments[i],
					callPos: callPos,
					argPos: i
				});	
			}
		}
		return failures;
	};


	Mock.prototype.verifyCallCounter = function(expectation) {
		var failures = [];
		if (expectation.capturedCount !== expectation.expectedCount) {
			failures.push({
				msg: "number of calls do not match",
				name: expectation.name,
				expected: expectation.expectedCount,
				captured: expectation.capturedCount,
			});
		}
		return failures;
	};


	Mock.prototype.toString = function() {
		return "MOCK[" + this.name + "]";
	};

	exports.Mock = Mock;
	exports.MOCKS = {
		createMock: function (propertyName) {
			var mock = new Mock(propertyName);
			contextMock[propertyName] = mock;
			this.mocks.push(mock);
			return mock;
		},
		getContextMock: function() {
			return contextMock;
		},
		mocks: [],
		verify: function() {
			var i, failures = [];
			for (i=0; i < this.mocks.length; i++) {
				failures = failures.concat(this.mocks[i].verify());
			}
			console.log(failures);
			return failures;
		}
	};
}(this));

