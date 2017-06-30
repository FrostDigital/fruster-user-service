const conf = require('../config');
const utils = require('./utils/utils');
const uuid = require('uuid');
const passwordUtils = require('./utils/password-utils');
const updatePassword = module.exports = {};

let database;
let validatePassword;
let getUserService;
let validatePasswordService;

updatePassword.init = (db, validatePassword, getUser) => {
	database = db;
	validatePasswordService = validatePassword;
	getUserService = getUser;
};

updatePassword.handle = request => {
	const data = request.data;
	const id = data.id;
	const oldPassword = data.oldPassword;
	const newPassword = data.newPassword;

	if (!request.user || request.user.id !== id)
		return utils.errors.forbidden();

	if (!new RegExp(conf.passwordValidationRegex).test(newPassword))
		return utils.errors.invalidPassword();

	return getUserService.handle({
		data: {
			id: id
		}
	})
		.then(userResponse => {
			const user = userResponse.data[0];

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
			const hashResponse = passwordUtils.hash(user.id, newPassword);

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