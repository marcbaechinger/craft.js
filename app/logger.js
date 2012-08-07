/*global */
/*jslint node: true */
var winston = require('winston'),
	logger  = new (winston.Logger)({
		transports: [
			new (winston.transports.Console)({ level: 'debug' }),
			new (winston.transports.File)({
				filename: 'craftjs.log',
				maxsize: 10 * 1000 * 1000,
				maxFiles: 5,
				json: false
			})
		]
	});

logger.cli();

exports.logger = logger;