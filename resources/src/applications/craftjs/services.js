/*global jQuery: false, alert: false, document: false, craftjs: false*/
(function (exports, $) {
	
	exports.craftjs.services = exports.craftjs.services || {};

	exports.craftjs.services.storeJob = function (job, callback) {
		$.ajax("/jobs", {
			type: "PUT",
			data: JSON.stringify(job),
			dataType: "json",
			contentType: "application/json",
			success: function (jsonData) {
				if (callback) {
					callback(jsonData);
				}
			}
		});
	};
	// FIXME remove dependency to craftjs.data.dist
	exports.craftjs.services.release = function (job, callback) {
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
			success: function (res) {
				if (callback) {
					callback(res);
				} else {
					console.log("res", res);
					document.location = "/" + craftjs.data.dist + "/" + res.path;
				}
			}
		});
	};


	exports.craftjs.services.deleteRelease = function (path, callback) {
		$.ajax("/project/build" + path, {
			type: "DELETE",
			dataType: "json",
			contentType: "application/json",
			success: function (jsonData) {
				if (callback && jsonData.status === "OK") {
					callback();
				}
			}
		});
	};

	exports.craftjs.services.deleteFile = function (path, callback) {
		$.ajax("/" + craftjs.data.context + "/" + path, {
			type: "DELETE",
			dataType: "json",
			contentType: "application/json",
			success: function (jsonData) {
				if (callback && jsonData.status === "OK") {
					callback();
				}
			}
		});
	};
	
}(this, jQuery));