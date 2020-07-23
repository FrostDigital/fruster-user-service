const conf = require("../../config");


class Utils {

	/**
	 * Validates that an email is an actual email.
	 *
	 * @param {String} email
	 */
	static validateEmail(email) {
		return new RegExp(conf.emailValidationRegex).test(email);
	}

	static toTitleCase(string) {
		if (string && string.length > 1)
			return string.substring(0, 1).toUpperCase() + string.substring(1);

		return string;
	}

	/**
	 * Checks a user's roles against the config to determine if the user should
	 * (or can, requireEmailVerification vs optionalEmailVerification) verify email.
	 *
	 * @param {Object} user
	 * @param {Array<String>} user.roles
	 */
	static userShouldVerifyEmail(user) {
		return (conf.requireEmailVerification
			|| conf.optionalEmailVerification)
			&&
			(conf.emailVerificationForRoles.includes("*")
				|| user.roles.find(r => conf.emailVerificationForRoles.includes(r)));
	}

}

module.exports = Utils;
