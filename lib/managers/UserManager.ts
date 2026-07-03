import config from "../../config";
import errors from "../errors";
import constants from "../constants";
import deprecatedErrors from "../deprecatedErrors";
import PasswordManager from "./PasswordManager";
import RoleManager from "./RoleManager";
import UserRepo from "../repos/UserRepo";
import Utils from "../utils/Utils";
import log from "@fruster/log";

class UserManager {
	_passwordManager: PasswordManager;
	_roleManager: RoleManager;
	_userRepo: UserRepo;

	constructor(passwordManager: PasswordManager, roleManager: RoleManager, userRepo: UserRepo) {
		this._passwordManager = passwordManager;
		this._roleManager = roleManager;
		this._userRepo = userRepo;
	}

	validateUpdateData(data: Record<string, any>): Record<string, any> {
		if (data.firstName && config.lowerCaseName) data.firstName = data.firstName.toLowerCase();
		if (data.lastName && config.lowerCaseName) data.lastName = data.lastName.toLowerCase();
		if (data.middleName && config.lowerCaseName) data.middleName = data.middleName.toLowerCase();

		return data;
	}

	handleUniqueIndexError(err: any, data: Record<string, any>): never {
		if (err.code && err.code !== constants.MONGO_DB_DUPLICATE_KEY_ERROR_CODE)
			throw err;

		let error;

		try {
			const errorMessage = err.message;
			const index = "index: ";
			const dupKey = "dup key:";
			const start = errorMessage.indexOf(index);
			const end = errorMessage.indexOf(dupKey);
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
			log.error("handleUniqueIndexError:", e);
			throw err;
		}

		throw error;
	}

	async validateInputData(data: Record<string, any>): Promise<void> {
		const requirePassword = config.requirePassword && !config.requireSendSetPasswordEmail;

		if (requirePassword && !data.password)
			throw deprecatedErrors.passwordRequired();

		if (requirePassword || data.password)
			this._passwordManager.validatePasswordFollowsRegExp(data.password);

		if (!config.withoutRequiredField && !Utils.validateEmail(data.email))
			throw deprecatedErrors.invalidEmail(data.email);

		const invalidRoles = await this._roleManager.validateRoles(data.roles);

		if (invalidRoles.length > 0)
			throw deprecatedErrors.invalidRoles(invalidRoles);
	}
}

export default UserManager;
