/*global $: false, namespace: f */
/*jslint browser: true */
//= require "/src/namespace"
(function () {
	var DataProvider = function (url) {
		this.url = url;
	};
		
	DataProvider.prototype.loadData = function (callback) {
		var that = this;
		$.ajax({
			url: this.url,
			dataType: "text",
			contentType: "text",
			success: function (text) {
				var records = [],
					athletIndex = {},
					countryIndex = {};
					
				$.each(text.split("\n"), function () {
					var record = that.parseRecordLine(this, records.length + 1);
					records.push(record);
					that.indexByProperty(athletIndex, record.name, record);
					that.indexByProperty(countryIndex, record.country, record);
				});
				console.log("loaded " + records.length + " records", countryIndex);
				callback(records, athletIndex, countryIndex);
			}
		});
	};
	DataProvider.prototype.parseRecordLine = function (line, id) {
		var tokenizedLine = line.split(";");
		return {
			id: id,
			sequence: tokenizedLine[0],
			time: tokenizedLine[1],
			timeNumeric: parseFloat(tokenizedLine[1]),
			wind: tokenizedLine[2],
			name: tokenizedLine[3],
			country: tokenizedLine[4],
			birthday: tokenizedLine[5],
			code: tokenizedLine[6],
			location: tokenizedLine[7],
			date: tokenizedLine[8]
		};
	};
	DataProvider.prototype.indexByProperty = function (map, index, record) {
		map[index] = map[index] || [];
		map[index].push(record);
	};
	
	namespace("hundert", {
		DataProvider: DataProvider
	});
}());