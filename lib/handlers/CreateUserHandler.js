const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserModel = require("../models/UserModel");
const ProfileModel = require("../models/ProfileModel");
const Utils = require("../utils/Utils");
const EmailUtils = require("../utils/EmailUtils");
const PasswordManager = require("../managers/PasswordManager");
const RoleManager = require("../managers/RoleManager");
const ProfileManager = require("../managers/ProfileManager");
const UserManager = require("../managers/UserManager");
const EmailManager = require("../managers/EmailManager");
const UserRepo = require("../repos/UserRepo");
const config = require("../../config");


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
		await this._userManager.validateInputData(data);

		let [user, profile] = this._profileManager.splitUserFields(data);

		user = new UserModel(user);
		profile.id = user.id;
		profile = new ProfileModel(profile);

		if (user.password) // no need to hash password if request has not password
			await this._passwordManager.hashPassword(user);

		const needSendVerifyEmail = Utils.userShouldVerifyEmail(user);
		let token;

		if (needSendVerifyEmail || config.requireSendSetPasswordEmail) {
			token = EmailUtils.generateToken(user.email);

			if (needSendVerifyEmail)
				user.addEmailVerificationToken(token);
			else
				user.addSetPasswordToken(EmailUtils.getHashedToken(token));
		}

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

		if (needSendVerifyEmail) {
			EmailManager.sendVerificationEmail(reqId, user, token);
		} else if (config.requireSendSetPasswordEmail) {
			EmailManager.sendSetPasswordEmail(reqId, user, token);
		}

		return {
			status: 201,
			data: await user.toViewModel(this._roleManager)
		};
	}

}

module.exports = CreateUserHandler;
