const conf = require('../config');
const utils = require('./utils/utils');
const uuid = require('uuid');
const passwordUtils = require('./utils/password-utils');
const updatePassword = module.exports = {};
const UserModel = require("./models/UserModel");

let database;
let validatePassword;
let getUserService;
let validatePasswordService;
let userRepo;

updatePassword.init = (db, validatePassword, _userRepo) => {
	database = db;
	validatePasswordService = validatePassword;
	userRepo = _userRepo;
};

updatePassword.handle = request => {
	const data = request.data;
	const id = data.id;
	const oldPassword = data.oldPassword;
	const newPassword = data.newPassword;

	if (!request.user || request.user.id !== id)
		throw utils.errors.forbidden();

	if (!new RegExp(conf.passwordValidationRegex).test(newPassword))
		throw utils.errors.invalidPassword();

	return userRepo.getById(id)
		.then(user => {
			user = new UserModel(user).toViewModel();

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
					throw utils.errors.forbidden();
				});
		})
		.then(user => {
			if (!user)
				throw utils.errors.forbidden();

			const hashResponse = passwordUtils.hash(user.id, newPassword);

			return database
				.update({
					id: id
				}, {
					$set: {
						password: hashResponse.hashedPassword,
						salt: hashResponse.salt,
						hashDate: hashResponse.hashDate
					}
				})
				.then(response => {
					return utils.accepted();
				});
		});
};