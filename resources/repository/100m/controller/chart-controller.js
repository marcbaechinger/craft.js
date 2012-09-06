/*global $: false, Observable: false, google: false, namespace: false */
/*jslint browser: true */
//= require "/src/namespace, /src/observable"
(function () {
	var COLORS = [
			"#FF9900", "#3366CC", "#DC3912", "#109618", "#990099",
			"#0099C6", "#DD4477", "#66AA00", "#B82E2E", "#316395",
			"#994499", "#22AA99", "#AAAA11", "#6633CC", "#E67300",
			"#8B0707", "#651067", "#329262", "#5574A6", "#3B3EAC",
			"#B77322", "#16D620", "#B91383", "#F4359E", "#9C5935",
			"#A9C413", "#2A778D", "#668D1C", "#BEA413", "#0C5922"
		],
		defaultFilter = {
			minTime: 9.2,
			maxTime: 10
		},
		dateToInteger = function (dateString) {
			var chunks = dateString.split(".");
			return (parseInt(chunks[1], 10) + (parseInt(chunks[2], 10) * 12)) / 12;
		},
		createNulledArray = function (initialSize) {
			var arr = [],
				i;
			for (i = 0; i < initialSize; i++) {
				arr[i] = null;
			}
			return arr;
		},
		createPaddedRow = function (record, numberOfSeries, serialIndex) {
			var row = createNulledArray(numberOfSeries + 1);
			row[0] = {
				v: dateToInteger(record.date),
				f: record.date
			};
			row[1 + serialIndex] = {
				v: parseFloat(record.time, 10),
				f: record.time + " sec"
			};
			return row;
		},
		ChartController = function ChartController(spec) {
			var that = this;
			Observable.call(this);
			this.chart = new google.visualization.ScatterChart(document.getElementById(spec.containerId));
			google.visualization.events.addListener(this.chart, 'onmouseover', function (item) {
				var row = item.row;
				if (that.dataSource.filteredRows) {
					row = that.dataSource.filteredRows[row];
				}
				that.emit("mouseover", that.dataSource.rawData[row]);
			});

			this.countLabel = $("#displayed-records-count");
			this.athlets = spec.runners;
			this.countries = spec.countries;
			this.aggregatedAthlets = spec.aggregatedRunners;
			this.aggregatedCountries = spec.aggregatedCountries;
			this.setData(spec.data);
		};

	ChartController.prototype = new Observable();

	ChartController.prototype.setData = function (data) {
		this.dataSources = {
			athlets: this.createDataSourceFromKeys(defaultFilter, this.aggregatedAthlets, this.athlets),
			countries: this.createDataSourceFromKeys(defaultFilter, this.aggregatedCountries, this.countries)
		};
		this.dataSource = this.dataSources.athlets;	
		this.filterData(defaultFilter);
	};
	ChartController.prototype.filterData = function (filter) {
		this.filter = filter;
		this.dataSource = filter.mode === "country" ? this.dataSources.countries : this.dataSources.athlets;
		this.dataSource.filteredRows = this.getFilteredRows(filter);
		this.dataSource.displayCount = this.dataSource.filteredRows.length;
		this.dataSource.view.setRows(this.dataSource.filteredRows);
		this.drawChart(this.dataSource);
	};
	ChartController.prototype.getFilteredRows = function (filter, athletes) {
		var rows = [],
			isInRange = function(record) {
				return record.timeNumeric >= filter.minTime && record.timeNumeric <= filter.maxTime;
			};
			
		$.each(this.dataSource.rawData, function (idx) {
			if (this.timeNumeric >= filter.minTime && this.timeNumeric <= filter.maxTime) {
				if (filter.runners) {
					if (filter.runners[this.name] && isInRange(this)) {
						rows.push(idx);
					}
				} else if (filter.countries) {
					if (filter.countries[this.country] && isInRange(this)) {
						rows.push(idx);
					}
				} else if (isInRange(this)){
					rows.push(idx);
				}
			}
		});
		return rows;
	};

	ChartController.prototype.drawChart = function (dataSource) {
		var options = {
			hAxis: {},
			vAxis: {},
			legend: 'none',
			height: 640,
			width: 1080,
			colors: dataSource.colors,
			chartArea: {
				width: 1000,
				height: 540
			}
		};
		this.chart.draw(dataSource.view, options);
		this.countLabel.text("records displayed: " + dataSource.displayCount);
    };
	ChartController.prototype.createDataSourceFromKeys = function (filter, recordMap, keys) {
		var count = 0,
			num,
			dataRows = [],
			dataSource = {};
		dataSource.table = new google.visualization.DataTable();
		dataSource.rawData = [];
		dataSource.colors = [];
		
		dataSource.table.addColumn('number', 'Date');
		num = this.defineColumns(dataSource, recordMap, keys);

		$.each(keys, function (name) {
			var records = recordMap[name].records;
			$.each(records, function () {
				if (this.timeNumeric <= filter.maxTime && this.timeNumeric >= filter.minTime) {
					dataRows.push(createPaddedRow(this, num, count));
					dataSource.rawData.push(this);
				}
			});
			count++;
		});
		dataSource.table.addRows(dataRows);
		dataSource.displayCount = dataRows.length;
		dataSource.view = new google.visualization.DataView(dataSource.table);
		return dataSource;
	};
	ChartController.prototype.defineColumns = function (dataSource, recordMap, keys) {
		var count = 0;
		$.each(keys, function (name) {
			count++;
			dataSource.colors.push(recordMap[name].color);
			dataSource.table.addColumn('number', name);
		});
		return count;
	};

	namespace("hundert", {
		ChartController: ChartController,
		COLORS: COLORS
	});
}());