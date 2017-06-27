const utils = require('./utils/utils');
const _ = require('lodash');
const conf = require('../config.js');
const emailUtils = require('./utils/email-utils.js');
const updateUser = module.exports = {};

let database;

updateUser.init = db => {
	database = db;
};

updateUser.handle = async request => {
	const userId = request.data.id;
	const updateUserData = request.data;

	if (_.size(updateUserData) === 0)
		return utils.errors.invalidJson();

	if (updateUserData.firstName)
		updateUserData.firstName = updateUserData.firstName.toLowerCase();

	if (updateUserData.lastName)
		updateUserData.lastName = updateUserData.lastName.toLowerCase();

	if (updateUserData.middleName)
		updateUserData.middleName = updateUserData.middleName.toLowerCase();

	if (updateUserData.email)
		updateUserData.email = updateUserData.email.toLowerCase();

	if (updateUserData.password)
		return utils.badRequest("Cannot update password", "Cannot update password through user update", 6);

	delete updateUserData.password;

	if (updateUserData.email) {
		if (!utils.validateEmail(updateUserData.email))
			return utils.errors.invalidEmail(updateUserData.email);

		return utils.validateEmailIsUnique(updateUserData.email, database, userId)
			.then(async emailIsUnique => {
				if (!emailIsUnique)
					return utils.errors.emailNotUnique(updateUserData.email);
				else {
					if (conf.requireEmailVerification) {
						updateUserData.emailVerificationToken = emailUtils.generateEmailVerificationToken(updateUserData);
						updateUserData.emailVerified = false;
						await emailUtils.sendMail(request.reqId, updateUserData);
					}

					return await updateInDatabase(updateUserData, userId);
				}
			});
	}

	return await updateInDatabase(updateUserData, userId);
};

async function updateInDatabase(updateUserData, userId) {
	const updateResponse = await database.update({ id: userId }, { $set: updateUserData });

	if (updateResponse.result.n === 0) {
		return utils.errors.userNotFound(userId);
	} else {
		const updatedUserFromDatabase = await database.findOne({ id: userId });
		return utils.ok(utils.cleanUserModelOutput(updatedUserFromDatabase));
	}
}