const conf = require('../config');
const utils = require('./utils/utils');
const uuid = require('uuid');
const passwordUtils = require('./utils/password-utils');
const setPassword = module.exports = {};

let database;

setPassword.init = (db) => {
	database = db;
};

setPassword.handle = request => {
	const data = request.data;
	const id = data.id;
	const newPassword = data.newPassword;

	if (!new RegExp(conf.passwordValidationRegex).test(newPassword))
		return utils.errors.invalidPassword();

	const hashResponse = passwordUtils.hash(id, newPassword);

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