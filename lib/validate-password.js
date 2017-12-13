const conf = require('../config');
const passwordUtils = require('./utils/password-utils');
const utils = require('./utils/utils');
const errors = require('./errors.js');
const validatePassword = module.exports = {};

let database;

validatePassword.init = db => {
	database = db;
};

validatePassword.handle = async (request, replyTo) => {
	const username = request.data.username;
	const password = request.data.password;

	if (!username)
		return utils.unauthorized(1, "Missing username");

	if (!password)
		return utils.unauthorized(2, "Missing password");

	const user = await database.findOne({ 'email': username.toLowerCase() });

	if (conf.requireEmailVerification && user.hasOwnProperty("emailVerified") && !user.emailVerified)
		throw errors.throw("EMAIL_NOT_VERIFIED");
	else if (user) {
		if (passwordUtils.validatePassword(user.password, user.salt, user.id, password, user.hashDate))
			return utils.ok(utils.cleanUserModelOutput(user));
		else
			return utils.unauthorized(3);

	}
	else
		return utils.unauthorized(4);
};