var conf = require('../config');
var utils = require('./utils/utils');
var uuid = require('uuid');
var passwordUtils = require('./utils/password-utils');
var database;

var validatePassword;
var getUserService;

var updatePassword = module.exports = {};

updatePassword.init = (db, validatePassword, getUser) => {
	database = db;
	validatePasswordService = validatePassword;
	getUserService = getUser;
};

updatePassword.handle = request => {
	var data = request.data;
	var id = data.id;
	var oldPassword = data.oldPassword;
	var newPassword = data.newPassword;

	if (!request.user || request.user.id !== id) {
		return utils.errors.forbidden();
	}

	if (!new RegExp(conf.passwordValidationRegex).test(newPassword)) {
		return utils.errors.invalidPassword();
	}

	return getUserService.handle({
			data: {
				id: id
			}
		})
		.then(userResponse => {
			var user = userResponse.data[0];

			return validatePasswordService.handle({
					data: {
						username: user.email,
						password: oldPassword
					}
				})
				.then(response => {
					if (response.status === 200) {
						return user;
					}
				})
				.catch(err => {
					return utils.errors.forbidden();
				});
		})
		.then(user => {
			var hashResponse = passwordUtils.hash(user.id, newPassword);

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
					return utils.accepted();
				});
		});
};