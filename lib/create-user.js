const conf = require('../config');
const utils = require('./utils/utils');
const log = require('fruster-log');
const passwordUtils = require('./utils/password-utils');
const emailUtils = require('./utils/email-utils.js');
const createUser = module.exports = {};

let database;

createUser.init = db => {
	database = db;
};

createUser.handle = async(request) => {
	try {
		const data = request.data;
		await validateInputData(data);

		let user = utils.UserModel(data);
		user = hashPassword(user);

		if (conf.requireEmailVerification) {
			user.emailVerificationToken = emailUtils.generateEmailVerificationToken(user);
			user.emailVerified = false;
			await emailUtils.sendMail(request.reqId, user);
		}

		const createdUser = await saveUser(user);

		return {
			reqId: request.reqId,
			status: 201,
			data: createdUser
		};
	} catch (err) {
		log.error(err);
		throw err;
	}
};

async function validateInputData(data) {
	if (!data.firstName)
		throw utils.errors.firstNameRequired();

	if (!data.lastName)
		throw utils.errors.lastNameRequired();

	if (conf.requirePassword && !data.password)
		throw utils.errors.passwordRequired();
	else if (data.password && !validatePassword(data.password))
		throw utils.errors.invalidPassword();

	if (!data.email)
		throw utils.errors.emailRequired();
	else if (!utils.validateEmail(data.email))
		throw utils.errors.invalidEmail(data.email);

	const invalidRoles = utils.validateRoles(data.roles);

	if (invalidRoles.length > 0)
		throw utils.errors.invalidRoles(invalidRoles);

	const emailIsUnique = await utils.validateEmailIsUnique(data.email, database);

	if (!emailIsUnique)
		throw utils.errors.emailNotUnique(data.email);
}

function validatePassword(password) {
	return new RegExp(conf.passwordValidationRegex).test(password);
}

function hashPassword(user) {
	var hashResponse = passwordUtils.hash(user.id, user.password);

	user.password = hashResponse.hashedPassword;
	user.salt = hashResponse.salt;
	user.hashDate = hashResponse.hashDate;

	return user;
}

async function saveUser(user) {
	const createdUser = await database.insert(user);
	return utils.cleanUserModelOutput(createdUser.ops[0]);
}