//= require "../../model/collection"
//= require "../../controller/model-aware-controller"
/*global $:false, model:false, controller:false, 
		movieList:true, movieListAlternative:true, movieDetailPanel:true */
$(function () {
	var nextId = 111,
		movieCollection = new model.Collection({
				data: [
					{id: 1, name: "Pulp ficiton", director: "Trentin Tarantino", actors: [
						{id: 1, name: "Nicole Kidman"},
						{id: 2, name: "Armin Mueller Stahl"},
						{id: 2, name: "Liselotte Pulver"}
					]},
					{id: 4, name: "Lost in transaltion", director: "Copolla", actors: [
						{id: 3, name: "Kevin Spacy"},
						{id: 4, name: "Hans Meiser"}
					]},
					{id: 2, name: "Night on earth", director: "Robert Altman", actors: [
						{id: 1, name: "Silvester Stallone"},
						{id: 2, name: "Lars Lundgren"},
						{id: 2, name: "Liselotte Pulver"}
					]},
					{id: 3, name: "Winnetou III", director: "Karl May", description: "Hauptling der Apachen", 
					actors: [
						{id: 1, name: "Hans Albers"},
						{id: 2, name: "Liselotte Pulver"}
					]}
				]
			}),
			selectMovie = function (movie) {
				var unSelectedQuery;
				movieDetailPanel.setModel(movie);
				if (movie) {
					unSelectedQuery = "[data-ui-id=" + movie.id + "]";
					movieList.container.find(".selected").removeClass("selected");
					movieList.container.find(unSelectedQuery).addClass("selected");
					movieListAlternative.container.find(".selected").removeClass("selected");
					movieListAlternative.container.find(unSelectedQuery).addClass("selected");
				}
			},
			movieSelectionHandler = function(ev) {
				var id = $(ev.target).closest("[data-ui-id]").data("ui-id");
				movieCollection.selectById(id);
			},
			/**
			 * The movie list to select movies
			 **/
			movieList = new controller.ModelAwareController({
				containerSelector: "#movie-list",
				model: movieCollection,
				events: {  "click li": movieSelectionHandler }
			}).init(),
			
			/**
			 * An alternative movie list to select from the very same movie collection
			 **/
			movieListAlternative = new controller.ModelAwareController({
				containerSelector: "#movie-list-alternative",
				model: movieCollection,
				events: { "click li": movieSelectionHandler }
			}).init(),
			/**
			 * a panel to display the selected movie
			 */
			movieDetailPanel = new controller.ModelAwareController({
				containerSelector: "#movie-detail",
				elementSelectors: {
					"nextButton": "button[data-action=next]",
					"prevButton": "button[data-action=prev]",
					"deleteButton": "button[data-action='delete-movie']"
				},
				scann: true,
				events: {
					/**
					 * make sure all buttons are enabled/disabled correctly after model has changed
					 **/
					"@model-set": function() {
						var pos = movieCollection.selectedPosition;
						
						this.$elements.prevButton.attr("disabled", "disabled");
						this.$elements.nextButton.attr("disabled", "disabled");
						if (pos > -1) {
							if (pos <  movieCollection.data.length - 1) {
								this.$elements.nextButton.removeAttr("disabled");
							}
							if (pos > 0) {
								this.$elements.prevButton.removeAttr("disabled");
							}	
							this.$elements.deleteButton.removeAttr("disabled");
						} else {
							this.$elements.deleteButton.attr("disabled", "disabled");
						}
					},
					"@delete-movie": function () {
						var pos = movieCollection.selectedPosition;
						movieCollection.remove(movieCollection.byPosition(pos));
						movieCollection.selectByPosition(pos);
					},
					"@next": function () {
						var pos = movieCollection.getSelectedPosition() + 1;
						if (pos < movieCollection.data.length) {
							movieCollection.selectByPosition(pos);
						}
					},
					"@prev": function () {
						var pos = movieCollection.getSelectedPosition() - 1;
						if (pos >= 0) {
							movieCollection.selectByPosition(pos);
						}
					},
					"@add-movie": function() {
						var name = prompt("Movie hinzufügen");
						if (name) {
							movieCollection.add({
								id: nextId++,
								name: name,
								director: "",
								actors: []
							});
						}
					},
					"click ul.list-view li": function() {
						var actor = prompt("hinzufügen");
						if (actor) {
							selectedMovie.get("actors").add({
								id: 7,
								name: actor
							});
						}
					}
				}
			}).init();
			
			// make application listen to selections on changes of movieCollection
			movieCollection.bind("selection", selectMovie);
			// set initial selection
			movieCollection.selectByPosition(0);
});