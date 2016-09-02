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
	var id = data.id;
	var newPassword = data.newPassword;

	if (!new RegExp(conf.passwordValidationRegex).test(newPassword)) {
		return utils.errors.invalidPassword();
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