/*global $: false, namespace: false, Observable: false */
/*jslint browser: true */
//= require "/src/namespace, /src/observable"
(function () {
	var filterModes = {
			athlet: "athlets",
			country: "country"
		},
		FilterController = function FilterController() {
			Observable.call(this);
			this.init();
		};

	FilterController.prototype = new Observable();
	FilterController.prototype.init = function () {
		var that = this,
			slider,
			filterMode = filterModes.athlet,
			runnerChooser = $("#runner-filter"),
			athletList = $("#athlet-list"),
			athletButton = runnerChooser.find(".btn.athlet"),
			countryList = $("#country-list"),
			countryButton = runnerChooser.find(".btn.country"),
			label = $("#filter-range"),
			refreshLabel = function () {
				label.text(slider.slider("values", 0) + " - " + slider.slider("values", 1) + " sec");
			},
			emitChangeEvent = function () {
				var athlets, countries;
				if (filterMode === filterModes.athlet) {
					athlets = that.getSelectedRunners();
				} else {
					countries = that.getSelectedCountries();
				}
				that.emit("change", {
					minTime: parseFloat(slider.slider("values", 0)),
					maxTime: parseFloat(slider.slider("values", 1)),
					runners: athlets,
					countries: countries,
					mode: filterMode
				});
			};

		this.selectedRunners = {};
		this.selectedCountries = {};
		slider = $("#time-slider").slider({
			max: 10,
			min: 9.5,
			step: 0.01,
			range: true,
			values: [9.5, 10],
			slide: refreshLabel,
			change: function () {
				refreshLabel();
				emitChangeEvent();
			}
		});

		$("#runner-query").bind("change", function (e) {
			var target = $(e.target),
				query = target.val().replace(/ /, "").toLowerCase();

			runnerChooser.find(".label").each(function () {
				var item = $(this);
				if (!item.find("input").attr("checked") && item.text().toLowerCase().indexOf(query) < 0) {
					item.parent().hide();
				} else {
					item.parent().show();
				}
			});
		});

		runnerChooser.bind("click", function (e) {
			var target = $(e.target),
				runner = target.data("runner"),
				country = target.data("country"),
				action = target.data("action");
				
			if (runner) {
				if (that.selectedRunners[runner]) {
					target.parent().css("background-color", "");
					delete that.selectedRunners[runner];
				} else {
					target.parent().css("background-color", target.parent().data("color"));
					that.selectedRunners[runner] = true;
				}
				emitChangeEvent();
				e.stopPropagation();
			} else if (country) {
				if (that.selectedCountries[country]) {
					target.parent().css("background-color", "");
					delete that.selectedCountries[country];
				} else {
					target.parent().css("background-color", target.parent().data("color"));
					that.selectedCountries[country] = true;
				}
				emitChangeEvent();
				e.stopPropagation();
			
			} else if (action === "show-countries") {
				filterMode = filterModes.country;
				athletList.hide();
				athletButton.removeClass("btn-inverse");
				athletButton.removeAttr("disabled");
				countryList.show();
				countryButton.addClass("btn-inverse");
				countryButton.attr("disabled", "disabled");
				emitChangeEvent();
			} else if (action === "show-athlets") {
				filterMode = filterModes.athlet;
				athletList.show();
				athletButton.addClass("btn-inverse");
				athletButton.attr("disabled", "disabled");
				countryList.hide();
				countryButton.removeClass("btn-inverse");
				countryButton.removeAttr("disabled");
				emitChangeEvent();
			}
		});
	};
	FilterController.prototype.getSelectedRunners = function () {
		var isEmpty = true;
		$.each(this.selectedRunners, function () {
			isEmpty = false;
			return isEmpty;
		});
		return isEmpty ? undefined : this.selectedRunners;
	};
	
	FilterController.prototype.getSelectedCountries = function () {
		var isEmpty = true;
		$.each(this.selectedCountries, function () {
			isEmpty = false;
			return isEmpty;
		});
		return isEmpty ? undefined : this.selectedCountries;
	};

	namespace("hundert", {
		FilterController: FilterController
	});
}());