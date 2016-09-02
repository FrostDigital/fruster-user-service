var conf = require('../config');
var utils = require('./utils/utils');
var uuid = require('uuid');
var passwordUtils = require('./utils/password-utils');
var database;


var createUser = module.exports = {};

createUser.init = db => {
	database = db;
};

createUser.handle = request => {
	let data = request.data;

	if (!data.firstName) {
		return utils.errors.firstNameRequired();
	}
	if (!data.lastName) {
		return utils.errors.lastNameRequired();
	}
	if (!data.email) {
		return utils.errors.emailRequired();
	}
	if (!data.password) {
		return utils.errors.passwordRequired();
	} else if (!validatePassword(data.password)) {
		return utils.errors.invalidPassword();
	}
	if (!utils.validateEmail(data.email)) {
		return utils.errors.invalidEmail(data.email);

	}
	let invalidRoles = utils.validateRoles(data.roles);
	if (invalidRoles.length > 0) {
		return utils.errors.invalidRoles(invalidRoles);
	}

	return utils.validateEmailIsUnique(data.email, database)
		.then(emailIsUnique => {
			if (!emailIsUnique) {
				return utils.errors.emailNotUnique(data.email);
			}
		})
		.then(x => {
			let user = utils.UserModel(data);
			user.id = uuid.v4();
			return user;
		})
		.then(hashPassword)
		.then(saveUser)
		.then(createdUser => {
			return {
				"status": 201,
				"data": createdUser,
				"error": {}
			};
		});
};

function invalidJsonError(message, detail, number) {
	return Promise.reject({
		"status": 400,
		"data": {},
		"error": {
			"code": 'user-service.400.' + number,
			"id": uuid.v4(),
			"title": message,
			"detail": detail
		}
	});
}

function validatePassword(password) {
	return new RegExp(conf.passwordValidationRegex).test(password);
}

function hashPassword(user) {
	var hashResponse = passwordUtils.hash(user.id, user.password);

	user.password = hashResponse.hashedPassword;
	user.salt = hashResponse.salt;

	return user;
}

function saveUser(user) {
	return database
		.insert(user)
		.then(createdUser => {
			return utils.cleanUserModelOutput(createdUser.ops[0]);
		});
}