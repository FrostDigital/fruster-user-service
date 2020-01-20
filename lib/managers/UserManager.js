const config = require("../../config");
const errors = require("../errors");
const constants = require("../constants");
const deprecatedErrors = require("../deprecatedErrors");
const PasswordManager = require("./PasswordManager");
const RoleManager = require("./RoleManager");
const UserRepo = require("../repos/UserRepo");
const Utils = require("../utils/Utils");
const log = require("fruster-log");


class UserManager {

	/**
	 * @param {PasswordManager} passwordManager
	 * @param {RoleManager} roleManager
	 * @param {UserRepo} userRepo
	 */
	constructor(passwordManager, roleManager, userRepo) {
		this._passwordManager = passwordManager;
		this._roleManager = roleManager;
		this._userRepo = userRepo;
	}

	/**
	 * Validates that update data is correct
	 *
	 * @param {Object} data
	 */
	validateUpdateData(data) {
		if (data.firstName && config.lowerCaseName)
			data.firstName = data.firstName.toLowerCase();

		if (data.lastName && config.lowerCaseName)
			data.lastName = data.lastName.toLowerCase();

		if (data.middleName && config.lowerCaseName)
			data.middleName = data.middleName.toLowerCase();

		return data;
	}

	/**
	 * @param {Object} err
	 * @param {Object} data
	 */
	handleUniqueIndexError(err, data) {
		if (err.code && err.code !== constants.MONGO_DB_DUPLICATE_KEY_ERROR_CODE)
			throw err;

		let error;

		try {
			const errorMessage = err.message;

			const index = "index: ";
			const dupKey = "dup key:";

			const start = errorMessage.indexOf(index)
			const end = errorMessage.indexOf(dupKey)

			let keyName = errorMessage.substring(start, end);
			keyName = keyName.replace(index, "").replace(dupKey, "");

			const keyNameSplits = keyName.split(".");

			keyName = keyNameSplits[keyNameSplits.length - 1];
			keyName = keyName.replace("_1", "").replace("$", "");
			keyName = keyName.trim();

			if (keyName === "email")
				error = deprecatedErrors.emailNotUnique(data.email);
			else {
				error = errors.get("fruster-user-service.*_NOT_UNIQUE", keyName, data[keyName]);
				error.error.title = error.error.title.replace("*", keyName);
				error.error.code = error.error.code.replace("*", keyName.toUpperCase());
			}
		} catch (e) {
			// Just in case something goes wrong, just pretend it never happened and throw the original error
			log.error("handleUniqueIndexError:", e);
			throw err;
		}

		throw error;
	}

	/**
	 * Validates request body for dynamic fields
	 *
	 * @param {Object} data request body data
	 */
	async validateInputData(data) {
		if (config.requirePassword && !data.password)
			throw deprecatedErrors.passwordRequired();

		if (config.requirePassword || data.password)
			this._passwordManager.validatePasswordFollowsRegExp(data.password);

		if (!Utils.validateEmail(data.email))
			throw deprecatedErrors.invalidEmail(data.email);

		const invalidRoles = await this._roleManager.validateRoles(data.roles);

		if (invalidRoles.length > 0)
			throw deprecatedErrors.invalidRoles(invalidRoles);
	}

}

module.exports = UserManager;
