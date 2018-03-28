const conf = require("../../config");
const uuid = require("uuid");


class Utils {

	/**
	 * Validates that an email is an actual email.
	 * 
	 * @param {String} email 
	 */
	static validateEmail(email) {
		return new RegExp(conf.emailValidationRegex).test(email);
	}

	/**
	 * Validates that an id is a uuid.
	 * 
	 * @param {String} id 
	 */
	static validateId(id) {
		return new RegExp(conf.idValidationRegex).test(id);
	}

	static toTitleCase(string) {
		if (string && string.length > 1)
			return string.substring(0, 1).toUpperCase() + string.substring(1);

		return string;
	}

}

module.exports = Utils;