const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserRepo = require("../repos/UserRepo");
const config = require("../../config");
const errors = require("../errors");
const deprecatedErrors = require("../deprecatedErrors");
const log = require("fruster-log");
const UserModel = require("../models/UserModel");
const PasswordManager = require("../managers/PasswordManager");
const RoleManager = require("../managers/RoleManager");


class ValidatePasswordHandler {

	/**
	 * @param {UserRepo} userRepo
	 * @param {PasswordManager} passwordManager
	 * @param {RoleManager} roleManager
	 */
	constructor(userRepo, passwordManager, roleManager) {
		this._repo = userRepo;
		this._passwordManager = passwordManager;
		this._roleManager = roleManager;
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handle({ data: { username, password } }) {
		try {
			username = username.toLowerCase().replace(/([.*+?=^!:${}()|[\]\/\\])/g, '\\$1');

			const query = { $or: [] };

			config.usernameValidationDbField.forEach(field => query.$or.push({
				[field]: { $regex: new RegExp(["^", username, "$"].join(""), "i") }
			}));

			const [user] = await this._repo.getUsersByQueryInternal(query);

			if (user && (await this._validatePassword(user, password))) {
				if (config.requireEmailVerification &&
					user &&
					user.hasOwnProperty("emailVerified") &&
					!user.emailVerified)
					throw errors.get("fruster-user-service.EMAIL_NOT_VERIFIED");

				return {
					status: 200,
					data: await user.toViewModel(this._roleManager)
				}
			}

			throw deprecatedErrors.invalidUsernameOrPassword();
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	/**
	 * Validates that the password is the password of the user found in database.
	 * Returns user if validation is sucessful.
	 *
	 * @param {UserModel} user
	 * @param {String} password
	 *
	 * @return {Promise<Boolean>}
	 */
	async _validatePassword({ password: userPassword, salt, id, hashDate }, password) {
		if ((await this._passwordManager.validatePassword(userPassword, salt, id, password, hashDate)))
			return true;
		else
			return false;
	}

}

module.exports = ValidatePasswordHandler;
