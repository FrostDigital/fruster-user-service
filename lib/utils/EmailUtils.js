const uuid = require("uuid");
const crypto = require("crypto");
const secureRandom = require("csprng");
const config = require("../../config");
const errors = require("../errors");
const UserModel = require("../models/UserModel");

class EmailUtils {

	/**
	 * @param {String} email user to generate email verification token for
	 * @returns {String}
	 */
	static generateToken(email) {
		return crypto.createHmac("sha256", secureRandom(256, 36) + uuid.v4() + email).digest("hex");
	}

	/**
	 * @param {string} message
	 * @param {UserModel} user
	 * @param {string} token
	 *
	 * @returns {String}
	 */
	static getEmailMessage(message, user, token) {
		message = EmailUtils._replaceAll(message, ":token:", token);

		Object.keys(user).forEach(key => {
			if (message.includes(key)) {
				let val = user[key];
				switch (key) {
					case "firstName":
					case "middleName":
					case "lastName": val = val.substring(0, 1).toUpperCase() + user[key].substring(1);
				}
				message = EmailUtils._replaceAll(message, `:user-${key}:`, val);
			}
		});

		return message;
	}

	/**
	 * @param {String} templateByRole
	 * @param {Array<String>} roles
	 * @returns {String}
	 */
	static getEmailTemplate(templateByRole, roles) {
		if (!roles)
			throw errors.internalServerError("Role not found for generating verification email by template");

		for (const row of templateByRole.split(";")) {
			const [rolesCSV, templateId] = row.split(":");

			for (const role of roles)
				if (rolesCSV.split(",").includes(role))
					return templateId;
		}

		throw errors.internalServerError(`Cannot found template for - ${JSON.stringify(roles)}`);
	}

	/**
	 * @param {String} string
	 * @param {String} search
	 * @param {String} replacement
	 * @returns {String}
	 */
	static _replaceAll(string, search, replacement) {
		return string.replace(new RegExp(search, "g"), replacement);
	}
}

module.exports = EmailUtils;
