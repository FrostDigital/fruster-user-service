const utils = require('./utils/utils');
const _ = require('lodash');
const conf = require('../config.js');
const emailUtils = require('./utils/email-utils.js');
const updateUser = module.exports = {};
const UserModel = require("./models/UserModel");

let database;

updateUser.init = db => {
	database = db;
};

updateUser.handle = async request => {
	const userId = request.data.id;
	const updateUserData = request.data;

	if (_.size(updateUserData) === 0)
		throw utils.errors.invalidJson();

	if (updateUserData.firstName && conf.lowerCaseName)
		updateUserData.firstName = updateUserData.firstName.toLowerCase();

	if (updateUserData.lastName && conf.lowerCaseName)
		updateUserData.lastName = updateUserData.lastName.toLowerCase();

	if (updateUserData.middleName && conf.lowerCaseName)
		updateUserData.middleName = updateUserData.middleName.toLowerCase();

	if (updateUserData.email)
		updateUserData.email = updateUserData.email.toLowerCase();

	if (updateUserData.password)
		throw utils.badRequest("Cannot update password", "Cannot update password through user update", 6);

	delete updateUserData.password;

	if (updateUserData.email) {
		if (!utils.validateEmail(updateUserData.email))
			throw utils.errors.invalidEmail(updateUserData.email);

		return utils.validateEmailIsUnique(updateUserData.email, database, userId)
			.then(async emailIsUnique => {
				if (!emailIsUnique)
					throw utils.errors.emailNotUnique(updateUserData.email);
				else {
					if (conf.requireEmailVerification) {
						updateUserData.emailVerificationToken = emailUtils.generateEmailVerificationToken(updateUserData);
						updateUserData.emailVerified = false;

						if (conf.emailVerificationEmailTempate)
							await emailUtils.sendMailWithTemplate(request.reqId, updateUserData, updateUserData.emailVerificationToken);
						else
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
		throw utils.errors.userNotFound(userId);
	} else {
		const updatedUserFromDatabase = await database.findOne({ id: userId });
		return utils.ok(new UserModel(updatedUserFromDatabase).toViewModel());
	}
}