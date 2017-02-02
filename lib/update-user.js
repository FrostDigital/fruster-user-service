var utils = require('./utils/utils');
var _ = require('lodash');
var database;

var updateUser = module.exports = {};


updateUser.init = db => {
	database = db;
};

updateUser.handle = request => {
	var id = request.data.id;
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

		return utils.validateEmailIsUnique(updateUserData.email, database)
			.then(emailIsUnique => {
				if (!emailIsUnique) {
					return utils.errors.emailNotUnique(updateUserData.email);
				} else {
					return updateInDatabase(updateUserData, id);
				}
			});
	}

	return updateInDatabase(updateUserData, id);
};

function updateInDatabase(updateUserData, id) {
	return database
		.update({
			id: id
		}, {
			$set: updateUserData
		})
		.then(response => {
			if (response.result.nModified === 1) {
				return database.findOne({
					id: id
				});
			} else {
				if (response.result.n === 0) {
					return utils.errors.userNotFound(id);
				} else {
					return utils.errors.userNotUpdated($set);
				}
			}
		})
		.then(updatedUserFromDatabase => {
			return utils.ok(utils.cleanUserModelOutput(updatedUserFromDatabase));
		});
}