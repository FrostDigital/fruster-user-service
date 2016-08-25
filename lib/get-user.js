/*jslint latedef:false, esversion:6*/

"use strict";

var conf = require('../config');
var utils = require('./utils/utils');
var uuid = require('uuid');
var passwordUtils = require('./utils/password-utils');
var _ = require('lodash');
var Promise = require('bluebird');
var database;

var getUser = module.exports = {};

getUser.init = db => {
	database = db;
};

getUser.handle = (request, replyTo) => {
	if (!request.data) {
		return utils.badRequest("Invalid json", "Invalid json in request body");
	}

	var query = toLowerCaseQuery(request.data);

	if (queryIncludesInvalidFields(query)) {
		return utils.badRequest("Invalid json", "Invalid json in request body");
	}

	return database.find(query)
		.then(users => {
			var usersToReturn = users.map(user => utils.cleanUserModelOutput(user));

			return ok(users);
		});

};

function toLowerCaseQuery(query) {
	var outputObj = {};

	_.forIn(query, (value, key) => {
		if (typeof value === "string") {
			outputObj[key] = value.toLowerCase();
		}
	});

	return outputObj;
}

function queryIncludesInvalidFields(query) {
	if (query.password || query.salt) {
		return true;
	} else {
		return false;
	}
}

function ok(data) {
	return {
		status: 200,
		data: data,
		error: {}
	};
}