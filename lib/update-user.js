var utils = require('./utils/utils');
var _ = require('lodash');
var database;

var updateUser = module.exports = {};


updateUser.init = db => {
	database = db;
};

updateUser.handle = request => {
	var userId = request.data.id;
	var updateUserData = request.data;

	if (_.size(updateUserData) === 0) {
		return utils.errors.invalidJson();
	}

	if (updateUserData.firstName) {
		updateUserData.firstName = updateUserData.firstName.toLowerCase();
	}

	if (updateUserData.lastName) {
		updateUserData.lastName = updateUserData.lastName.toLowerCase();
	}

	if (updateUserData.middleName) {
		update.middleName = updateUserData.middleName.toLowerCase();
	}

	if (updateUserData.email) {
		updateUserData.email = updateUserData.email.toLowerCase();
	}

	if (updateUserData.password) {
		return utils.badRequest("Cannot update password", "Cannot update password through user update", 6);
	}
	delete updateUserData.password;

	if (updateUserData.email) {
		if (!utils.validateEmail(updateUserData.email)) {
			return utils.errors.invalidEmail(updateUserData.email);
		}

		return utils.validateEmailIsUnique(updateUserData.email, database, userId)
			.then(emailIsUnique => {
				if (!emailIsUnique) {
					return utils.errors.emailNotUnique(updateUserData.email);
				} else {
					return updateInDatabase(updateUserData, userId);
				}
			});
	}

	return updateInDatabase(updateUserData, userId);
};

function updateInDatabase(updateUserData, userId) {
	return database
		.update({
			id: userId
		}, {
			$set: updateUserData
		})
		.then(response => {
			if (response.result.nModified === 1) {
				return database.findOne({
						id: userId
					})
					.then(updatedUserFromDatabase => utils.ok(utils.cleanUserModelOutput(updatedUserFromDatabase)));
			} else {
				if (response.result.n === 0) {
					return utils.errors.userNotFound(userId);
				} else {
					return utils.ok();
				}
			}
		});
}