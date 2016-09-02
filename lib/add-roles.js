var conf = require('../config');
var utils = require('./utils/utils');
var uuid = require('uuid');
var passwordUtils = require('./utils/password-utils');
var database;

var setPassword = module.exports = {};

setPassword.init = (db) => {
	database = db;
};

setPassword.handle = request => {
	var data = request.data;
	var roles = request.data.roles;

	let invalidRoles = utils.validateRoles(data.roles);
	if (invalidRoles.length > 0) {
		return utils.errors.invalidRoles(invalidRoles);
	}

	var hashResponse = passwordUtils.hash(id, newPassword);

	return database
		.update({
			id: id
		}, {
			$set: {
				password: hashResponse.hashedPassword,
				salt: hashResponse.salt
			}
		})
		.then(response => {
			if (response.result.n === 0) {
				return utils.errors.userNotFound(id);
			} else {
				return utils.accepted();
			}
		});
};