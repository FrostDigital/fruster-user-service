/*jslint latedef:false, esversion:6*/

"use strict";

var conf = require('../config');
var passwordUtils = require('./password-utils');
var Promise = require('bluebird');
var database;

var validatePassword = module.exports = {};

validatePassword.init = db => {
	database = db;
};

validatePassword.handle = (request, replyTo) => {
	var email = request.data.email,
		password = request.data.password;

	if (!email) {
		return unauthorized();
	}
	if (!password) {
		return unauthorized();
	}

	return database //TODO: Use get User? (so we get scopes etc)
		.findOne({
			'email': email
		})
		.then(user => {
			if (user) {
				if (passwordUtils.validatePassword(user.password, user.salt, email, password)) {
					return ok();
				} else {
					return unauthorized();
				}
			} else {
				return unauthorized();
			}
		});
};

function ok() {
	return {
		"status": 200,
		"data": {},
		"error": {}
	};
}

function unauthorized() {
	return {
		"status": 401,
		"data": {},
		"error": {}
	};
}