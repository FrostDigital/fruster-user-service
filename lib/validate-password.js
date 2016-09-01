var conf = require('../config');
var passwordUtils = require('./utils/password-utils');
var utils = require('./utils/utils');
var database;

var validatePassword = module.exports = {};


validatePassword.init = db => {
	database = db;
};


validatePassword.handle = (request, replyTo) => {
	var username = request.data.username,
		password = request.data.password;

	if (!username) {
		return utils.unauthorized(1);
	}
	if (!password) {
		return utils.unauthorized(2);
	}

	/*
	 * Uses query to database because user-service.get-user filters away password & sant.
	 * This is the only place where we would need that. 
	 */
	return database
		.findOne({
			'email': username
		})
		.then(user => {
			if (user) {
				if (passwordUtils.validatePassword(user.password, user.salt, user.id, password)) {
					return utils.ok();
				} else {
					return utils.unauthorized(3);
				}
			} else {
				return utils.unauthorized(4);
			}
		});
};