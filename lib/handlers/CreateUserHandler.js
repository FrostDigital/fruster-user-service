const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const config = require("../../config");
const EmailUtils = require("../utils/EmailUtils");
const UserModel = require("../models/UserModel");
const ProfileModel = require("../models/ProfileModel");
const log = require("fruster-log");
const Utils = require("../utils/Utils");
const PasswordManager = require("../managers/PasswordManager");
const RoleManager = require("../managers/RoleManager");
const ProfileManager = require("../managers/ProfileManager");
const UserManager = require("../managers/UserManager");


class CreateUserHandler {

	/**
	 * @param {UserRepo} userRepo
	 * @param {PasswordManager} passwordManager
	 * @param {RoleManager} roleManager
	 * @param {ProfileManager} profileManager
	 * @param {UserManager} userManager
	 */
	constructor(userRepo, passwordManager, roleManager, profileManager, userManager) {
		this._userRepo = userRepo;
		this._passwordManager = passwordManager;
		this._roleManager = roleManager;
		this._profileManager = profileManager;
		this._userManager = userManager;
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handle({ reqId, data }) {
		try {
			await this._userManager.validateInputData(data);

			let [user, profile] = this._profileManager.splitUserFields(data);

			user = new UserModel(user);
			profile.id = user.id;
			profile = new ProfileModel(profile);

			await this._passwordManager.hashPassword(user);

			if (Utils.userShouldVerifyEmail(user))
				this._handleEmailVerificationSetup(reqId, user);

			let createdUser;

			try {
				createdUser = await this._userRepo.saveUser(user);
			} catch (err) {
				throw this._userManager.handleUniqueIndexError(err, user);
			}

			/** If profile has more keys than its id we need to save the profile, otherwise we don't bother */
			if (Object.keys(profile).length > 1) {
				const createdProfile = await this._profileManager.saveProfile(profile);
				user = createdUser.concatWithProfile(createdProfile);
			}

			return {
				status: 201,
				data: await user.toViewModel(this._roleManager)
			};
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	/**
	 * Handles setting up email verification, if configured to do so.
	 *
	 * @param {String} reqId
	 * @param {UserModel} user
	 */
	async _handleEmailVerificationSetup(reqId, user) {
		user.addEmailVerificationToken(EmailUtils.generateEmailVerificationToken(user));

		if (config.emailVerificationEmailTempate)
			await EmailUtils.sendMailWithTemplate(reqId, user, user.emailVerificationToken, this._roleManager);
		else
			await EmailUtils.sendMail(reqId, user);
	}

}

module.exports = CreateUserHandler;
