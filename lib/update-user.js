var utils = require('./utils/utils');
var _ = require('lodash');
var database;

var updateUser = module.exports = {};


updateUser.init = db => {
	database = db;
};

updateUser.handle = request => {
	var id = request.data.id;
	var updateUser = utils.UserModel(request.data);

	if (updateUser.password) {
		return utils.badRequest("Cannot update password", "Cannot update password through user update", 6);
	}
	delete updateUser.password;

	if (updateUser.email) {
		if (!utils.validateEmail(updateUser.email)) {
			return utils.errors.invalidEmail(updateUser.email);
		}

		return utils.validateEmailIsUnique(updateUser.email, database)
			.then(emailIsUnique => {
				if (!emailIsUnique) {
					return utils.errors.emailNotUnique(updateUser.email);
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
			$set[key] = value;
		}
	});

	if (_.size($set) === 0) {
		return utils.errors.invalidJson();
	}

	return database
		.update({
			id: id
		}, {
			$set: $set
		})
		.then(response => {
			if (response.result.n === 0) {
				return utils.errors.userNotFound(id);
			}			
			return database.findOne({
				id: id
			});
		})
		.then(updatedUserFromDatabase => {
			return utils.ok(utils.cleanUserModelOutput(updatedUserFromDatabase));
		});
}