/*jslint latedef:false, esversion:6*/

"use strict";

var conf = require('../config');
var passwordUtils = require('./utils/password-utils');
var Promise = require('bluebird');
var utils = require('./utils/utils');
var database;

var validatePassword = module.exports = {};

validatePassword.init = db => {
	database = db;
};

validatePassword.handle = (request, replyTo) => {
	var email = request.data.email,
		password = request.data.password;

	if (!email) {
		return utils.unauthorized();
	}
	if (!password) {
		return utils.unauthorized();
	}

	return database
		.findOne({
			'email': email
		})
		.then(user => {
			if (user) {
				if (passwordUtils.validatePassword(user.password, user.salt, user.id, password)) {
					return utils.ok();
				} else {
					return utils.unauthorized();
				}
			} else {
				return utils.unauthorized();
			}
		});
};