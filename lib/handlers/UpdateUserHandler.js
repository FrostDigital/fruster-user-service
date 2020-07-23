const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const Utils = require("../utils/Utils");
const EmailUtils = require("../utils/EmailUtils");
const config = require("../../config");
const deprecatedErrors = require("../deprecatedErrors");
const errors = require('../errors');
const PasswordManager = require('../managers/PasswordManager');
const RoleManager = require('../managers/RoleManager');
const ProfileManager = require("../managers/ProfileManager");
const UserManager = require("../managers/UserManager");
const EmailManager = require("../managers/EmailManager");
const UserModel = require('../models/UserModel');
const log = require("fruster-log");


class UpdateUserHandler {

	/**
	 * @param {UserRepo} userRepo
	 * @param {PasswordManager} passwordManager
	 * @param {RoleManager} roleManager
	 * @param {ProfileManager} profileManager
	 * @param {UserManager} userManager
	 */
	constructor(userRepo, passwordManager, roleManager, profileManager, userManager) {
		this._repo = userRepo;
		this._passwordManager = passwordManager;
		this._roleManager = roleManager;
		this._profileManager = profileManager;
		this._userManager = userManager;
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handle({ reqId, data: { id: userId, ...updateUserData } }) {
		updateUserData = this._userManager.validateUpdateData(updateUserData);

		if (updateUserData.email)
			updateUserData.email = updateUserData.email.toLowerCase();

		if (updateUserData.password && (!config.requirePasswordOnEmailUpdate && !updateUserData.email))
			throw deprecatedErrors.cannotUpdatePassword();

		/** If request body contains email */
		if (updateUserData.email)
			await this._handleEmailUpdateValidation(userId, updateUserData);

		delete updateUserData.password;

		/** If email verification is required, this has to be prepared */
		if (updateUserData.email && (config.requireEmailVerification || config.optionalEmailVerification)) {
			const getUser = await this._repo.getById(userId);

			if (getUser.email !== updateUserData.email && Utils.userShouldVerifyEmail(getUser)) {
				log.debug("config.requireEmailVerification or config.optionalEmailVerification is true, so we need to prepare new email verification data for user", userId);
				const token = EmailUtils.generateEmailVerificationToken(updateUserData.email);
				const updateUser = new UserModel({ ...getUser, ...updateUserData });
				updateUser.addEmailVerificationToken(token);
				EmailManager.sendVerificationEmail(reqId, updateUser, token);
			}
		}

		/** Splits update data into user / profile and only updates fields configured to be part of the user dataset */
		const [user] = await this._profileManager.splitUserFields(updateUserData);

		let updatedUser;

		try {
			updatedUser = await this._updateInDatabase(userId, user);
		} catch (err) {
			throw this._userManager.handleUniqueIndexError(err, user);
		}

		const returnUser = new UserModel(updatedUser);

		return {
			status: 200,
			data: await returnUser.toViewModel(this._roleManager)
		};
	}

	/**
	 * @param {FrusterRequest} req
	 */
	handleHttp(req) {
		req.data = req.data || {};
		req.data.id = req.params.id;

		return this.handle(req);
	}

	/**
	 * Validates everything related to updating email.
	 *
	 * @param {String} userId
	 * @param {Object} updateUserData
	 *
	 * @return {Promise<Void>}
	 */
	async _handleEmailUpdateValidation(userId, updateUserData) {
		log.debug("Validates email of user", userId);

		if (config.requirePasswordOnEmailUpdate) {
			log.debug("Password is required to inputted when changing email for user", userId);

			/** If  password is required when changing email password has to be in request body */
			if (!updateUserData.password)
				throw errors.get("fruster-user-service.PASSWORD_REQUIRED");

			/** And it has to be valid. */
			else if (!await this._passwordManager.validatePasswordForUser(updateUserData.password, userId))
				throw errors.get("fruster-user-service.UNAUTHORIZED");
			else
				log.debug("Password validated correctly for user", userId);
		}

		/** Email has to be valid */
		if (!Utils.validateEmail(updateUserData.email))
			throw deprecatedErrors.invalidEmail(updateUserData.email);

		log.debug("Successfully validated email for user", userId);
	}

	/**
	 * Updates user in database.
	 *
	 * @param {String} userId
	 * @param {Object} updateUserData
	 */
	async _updateInDatabase(userId, updateUserData) {
		log.debug("Updates user", userId, "in database");

		const updateResponse = await this._repo.updateUser(userId, updateUserData);

		log.debug("Successfully updates user", userId, "in database");

		return updateResponse;
	}

}

module.exports = UpdateUserHandler;
