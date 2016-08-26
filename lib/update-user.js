/*jslint latedef:false, esversion:6*/

"use strict";

var utils = require('./utils/utils');
var _ = require('lodash');
var database;

var updateUser = module.exports = {};


updateUser.init = db => {
	database = db;
};

updateUser.handle = request => {
	var id = request.data.id;
	var updateUser = new utils.UserModel(request.data);

	if (updateUser.password) {
		return utils.badRequest("Cannot update password", "Cannot update password through user update");
	}
	delete updateUser.password;

	if (updateUser.email) {
		if (!utils.validateEmail(updateUser.email)) {
			return utils.badRequest("Invalid email", "provided email address is invalid");
		}
	}

	//TODO VALIDATE NEW EMAIL IS NOT REGISTERED TO SOMEONE ELSE

	var $set = {};

	_.each(updateUser, (value, key) => {
		if (value && !(value instanceof Array)) {
			$set[key] = value;
		}
	});

	return database
		.update({
			id: id
		}, {
			$set: $set
		})
		.then(response => {
			if (response.result.n === 1) {
				return database.findOne({
					id: id
				});
			} else {
				return utils.badRequest("User was not updated", "User was not updated");
			}
		})
		.then(updatedUserFromDatabase => {
			return utils.ok(utils.cleanUserModelOutput(updatedUserFromDatabase));
		});
};