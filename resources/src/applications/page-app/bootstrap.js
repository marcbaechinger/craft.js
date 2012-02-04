//= require "../../model/collection"
//= require "../../controller/model-aware-controller"
/*global $:false, model:false, controller:false*/
$(function () {
	var createTemplate = function(id) {
			var template = $("#" + id).text();
			return function(viewData) {
				return Mustache.to_html(template, viewData);
			};
		},
		pageTemplate = createTemplate("page-template"),
		pages = new model.Collection({
			data: [
				{
					id: 1, 
					title: "Ubersicht",
					content: "<hr/><ul><li>1</li><li>2</li></ul><hr/>",
					next: "2"
				},
				{
					id: 2, 
					title: "Produkte",
					content: "<hr/>",
					next: "3",
					prev: "1"
				},
				{
					id: 3, 
					title: "Services",
					next: "4",
					prev: "2"
				},
				{
					id: 4, 
					title: "Team",
					prev: "3"
				}
			]
		}),
		site = new controller.ModelAwareController({
			containerSelector: "#site",
			renderTargetSelector: ".target",
			model: pages,
			renderItem: function(page) {
				return pageTemplate(page.data);
			},
			events: {
				"@select-page": function(ev) {
					pages.selectById($(ev.target).data("page-id"));
				},
				"@selection": function(ev, data) {
					var that = this, 
						selectedElements = this.container.find(".page:visible"),
						showSelectedPage = function() {
							that.container.find("#page-" + pages.selectedModel.id).slideDown(400);
						};
						
					if (selectedElements.length > 0) {	
						selectedElements.slideUp(400, showSelectedPage);
					} else {	
						that.container.find("#page-" + pages.selectedModel.id).show();
					}
				}
			}
		}).init();
		
	pages.selectByPosition(0);			
});