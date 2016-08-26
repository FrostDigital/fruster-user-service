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
		return utils.badRequest("Cannot update password", "Cannot update password through user update", 5);
	}
	delete updateUser.password;

	if (updateUser.email) {
		if (!utils.validateEmail(updateUser.email)) {
			return utils.badRequest("Invalid email", "provided email address is invalid: " + updateUser.email, 6);
		}

		return utils.validateEmailIsUnique(updateUser.email, database)
			.then(emailIsUnique => {
				if (!emailIsUnique) {
					return utils.badRequest("Email is not unique", "Another account has already been registered with the provided email-address: " + updateUser.email, 9);
				} else {
					return updateInDatabase(updateUser, id);
				}
			});
	}

	return updateInDatabase(updateUser, id);
};

function updateInDatabase(updateUser, id) {
	var $set = {};

	_.each(updateUser, (value, key) => {
		if (value && !(value instanceof Array)) {
			$set[key] = typeof value === "string" ? value.toLowerCase() : value;
		}
	});

	if (_.size($set) === 0) {
		return utils.badRequest("Invalid request body", "Invalid request body", 10);
	}

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
				return utils.badRequest("User was not updated", "User was not updated", 7);
			}
		})
		.then(updatedUserFromDatabase => {
			return utils.ok(utils.cleanUserModelOutput(updatedUserFromDatabase));
		});
}