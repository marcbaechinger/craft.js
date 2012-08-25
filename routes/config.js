/*jslint node: true */
/*global process: false */
(function () {
	"use strict";

	var fs = require("fs"),
		path = require("path"),
		wrench = require("wrench"),
		io = require("./io-util.js"),
		cdn = require("../app/cdn/cdn.js"),
		errorPage = require("./error-page.js"),
		appConfig = require("../app-config.js"),
		RepositoryManager = require("../app/git/repository-manager.js").RepositoryManager,
		logger = require("../app/logger.js").logger,
		createErrorDelegator = function (res) {
			return function (err) {
				logger.error("errorDelegator" + JSON.stringify(err));
				if (typeof err === "string") {
					res.send({
						status: "error",
						message: err
					});
				} else {
					res.send(JSON.stringify(err));
				}
				
			};
		},
		writeConfiguration = function (req, res, configuration, callback) {
			var configFilePath = path.join(__dirname, "../app-config.json");
			io.writeFile(configFilePath, JSON.stringify(configuration, null, 4),
				function () {
					res.send(JSON.stringify({
						status: "ok",
						configuration: configuration
					}));

					if (callback) { callback(); }
				},
				function (error) {
					error.statusCode = 403;
					errorPage.sendErrorPage(req, res, error);
				}
				);
		},
		getConfigFilePath = function () {
			return path.join(__dirname, "../app-config.json");
		},
		repositoryManager = new RepositoryManager(function () {
			return appConfig.path.src;
		}),
		readConfiguration = function (callback, errorCallback) {
			fs.readFile(getConfigFilePath(), function (error, data) {
				if (error) {
					errorCallback({
						code: 404
					});
				} else {
					callback(JSON.parse(data));
				}
			});
		},
		updateConfiguration = function (req, res) {
			fs.readFile(getConfigFilePath(), function (error, data) {
				var configuration;
				if (error) {
					error.statusCode = 404;
					errorPage.sendErrorPage(req, res, error);
				} else {
					configuration =  JSON.parse(data);
					configuration.path.src = req.body.path;
					configuration.useGit = req.body.useGit || false;
					writeConfiguration(req, res, configuration, function () {
						appConfig.path.src = configuration.path.src;
						appConfig.useGit = req.body.useGit || false;
					});
				}
			});
		},
		removeGitHook = function (req, res) {
			var repoName = req.body.name,
				repoDirectory = appConfig.path.src + "/" + repoName;
			repositoryManager.exists(repoName, function (exists) {
				if (exists) {
					readConfiguration(function (configuration) {
						delete configuration.gitHooks[repoName];
						writeConfiguration(req, res, configuration, function () {
							delete appConfig.gitHooks[repoName];
							res.send(JSON.stringify({
								status: "ok",
								message: "GIT repository  '" + repoName + "' removed"
							}));
							logger.info("deleting GIT repository " + repoDirectory + " from disc");
							wrench.rmdirRecursive(repoDirectory, function () {
								logger.info("removed GIT repsoitory " + repoName + " from configuration");
							});
						});
					
					});
				} else {
					res.send(JSON.stringify({
						status: "error",
						message: "no repository with name '" + repoName + "' exists"
					}));
				}
			});
		},
		addCdnResource = function (req, res) {
			var resource = req.body;
			readConfiguration(function (configuration) {
				if (configuration.cdnLibs[resource.name]) {
					res.send(JSON.stringify({
						status: "error",
						message: "a cdn library with name '" + resource.name + "' already exists"
					}));
				} else {
					cdn.storeResource(resource.url, appConfig.path.src + "/cdn/" + resource.name, function (content) {
						configuration.cdnLibs[resource.name] = resource.url;
						writeConfiguration(req, res, configuration, function () {
							appConfig.cdnLibs[resource.name] = resource.url;
						});
						res.send(JSON.stringify({
							status: "ok",
							message: "succesfully added CDN resource " + req.body.name
						}));
					}, createErrorDelegator(res));
				}
			}, function () {
				res.send(JSON.stringify({
					status: "error",
					message: "cont read configuration file in " + getConfigFilePath()
				}));
			});
		},
		removeCdnResource = function (req, res) {
			var resource = req.body;
			readConfiguration(function (configuration) {
				if (!configuration.cdnLibs[resource.name]) {
					res.send(JSON.stringify({
						status: "error",
						message: "a cdn library with name '" + resource.name + "' does not exists"
					}));
				} else {
					delete configuration.cdnLibs[resource.name];
					writeConfiguration(req, res, configuration, function () {
						delete appConfig.cdnLibs[resource.name];
						io.deleteFile(appConfig.path.src + "/cdn/" + resource.name, function(e) {
							if (!e) {
								res.send(JSON.stringify({
									status: "ok",
									message: "succesfully removed CDN resource " + req.body.name
								}));
							} else {
								res.send(JSON.stringify({
									status: "error",
									message: "error deleting cdn resource " + req.body.name
								}));
							}
						});
					});
				}
			}, function () {
				res.send(JSON.stringify({
					status: "error",
					message: "cont read configuration file in " + getConfigFilePath()
				}));
			});
		},
		gitPull = function (req, res) {
			var repositoryName = req.body.name;
			repositoryManager.pull(repositoryName, function (data) {
				logger.debug("succesfully pulled director " + repositoryName);
				res.send(JSON.stringify({
					status: "ok",
					message: "succesfully pulled director " + repositoryName,
					output: data
				}));
			}, createErrorDelegator(res));
		},
		addGitHook = function (req, res) {
			var configFilePath = getConfigFilePath(),
				gitHook = req.body,
				cloneDirectory = appConfig.path.src + "/" + gitHook.name;
		
			repositoryManager.exists(gitHook.name, function (exists) {
				if (exists === false) {
					readConfiguration(function (configuration) {
						if (configuration.gitHooks[gitHook.name]) {
							res.send(JSON.stringify({
								status: "error",
								message: "a hook with name '" + gitHook.name + "' already exists"
							}));
						} else {
							logger.info("cloning git repository into '" + cloneDirectory + "'");
							repositoryManager.clone(gitHook.url, gitHook.name, function () {
								logger.debug("succefully cloned from " + gitHook.url);
								configuration.gitHooks[gitHook.name] = gitHook.url;
								writeConfiguration(req, res, configuration, function () {
									appConfig.gitHooks[gitHook.name] = gitHook.url;
								});
							}, createErrorDelegator(res));
						}
					}, function () {
						res.send(JSON.stringify({
							status: "error",
							message: "cont read configuration file in " + getConfigFilePath()
						}));
					});
				} else {
					res.send(JSON.stringify({
						status: "error",
						message: "clone directory '" + cloneDirectory + "' already exists"
					}));
				}
			});
		},
		sendConfigPage = function (req, res) {
			res.statusCode = 200;
			res.header("Content-Type", "text/html");
			res.render('config', {
				displayMode: "config",
				context: "config",
				useGit: appConfig.useGit,
				gitHooks: appConfig.gitHooks,
				cdnLibs: appConfig.cdnLibs,
				repositoryPath: appConfig.path.src,
				config: {
					context: {
						src: "repo",
						dist: "dist",
						jobs: "jobs"
					}
				}
			});
		};
	
	exports.init = function (app, contextPath) {
		app.get(contextPath, sendConfigPage);
		app.post(contextPath,  updateConfiguration);
		app.post(contextPath + "/githook",  addGitHook);
		app.delete(contextPath + "/githook/:name", removeGitHook);
		app.put(contextPath + "/githook/:name", gitPull);
		app.post(contextPath + "/cdn/:name", addCdnResource);
		app.delete(contextPath + "/cdn/:name", removeCdnResource);
	};
}());