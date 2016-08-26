/*jslint latedef:false, esversion:6*/

"use strict";

var conf = require('../config');
var passwordUtils = require('./utils/password-utils');
var Promise = require('bluebird');
var database;

var validatePassword = module.exports = {};

validatePassword.init = db => {
	database = db;
};

validatePassword.handle = (request, replyTo) => {
	var username = request.data.username,
		password = request.data.password;

	if (!username) {
		return unauthorized();
	}
	if (!password) {
		return unauthorized();
	}

	return database //TODO: Use get User? (so we get scopes etc)
		.findOne({
			'email': username
		})
		.then(user => {
			if (user) {
				if (passwordUtils.validatePassword(user.password, user.salt, user.id, password)) {
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