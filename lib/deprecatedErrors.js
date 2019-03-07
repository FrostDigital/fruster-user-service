/**
 * DEPRECATED ERRORS.
 * New development should never use these!
 * ...one day we might be able to remove this once and for all.
 */

const uuid = require("uuid");
const serviceId = "user-service";
const errorCode = {

	invalidPassword: serviceId + ".400.3",
	invalidRoles: serviceId + ".400.4",
	invalidEmail: serviceId + ".400.5",
	cannotUpdatePassword: serviceId + ".400.6",
	passwordRequired: serviceId + ".400.7",
	emailNotUnique: serviceId + ".400.10",
	invalidJson: serviceId + ".400.13",
	cannotRemoveLastRole: serviceId + ".400.14",

	invalidUsernameOrPassword: serviceId + ".401.3",

	forbidden: serviceId + ".403.1",

	userNotFound: serviceId + ".404.1"

};

module.exports = {

	/** @return {Error} */
	userNotFound: id => { return error(404, errorCode.userNotFound, "User not found", "User with id " + id + " was not found"); },

	invalidPassword: () => { return error(400, errorCode.invalidPassword, "Invalid password", "Password is invalid"); },

	invalidRoles: (roles) => { return error(400, errorCode.invalidRoles, "Invalid roles", "Roles contains invalid role(s) " + roles); },

	invalidEmail: (email) => { return error(400, errorCode.invalidEmail, "Invalid email", "Email " + email + " is invalid"); },

	cannotUpdatePassword: () => { return error(400, errorCode.cannotUpdatePassword, "Cannot update password", "Cannot update password through user update"); },

	passwordRequired: () => { return error(400, errorCode.passwordRequired, "password is required", "Field password in request body is required"); },

	emailNotUnique: (email) => { return Error(400, errorCode.emailNotUnique, "Email is not unique", "Another account has already been registered with the provided email-address: " + email); },

	invalidJson: () => { return error(400, errorCode.invalidJson, "Invalid json", "Invalid json in request body"); },

	cannotRemoveLastRole: () => { return error(400, errorCode.cannotRemoveLastRole, "Cannot remove last role", "User must have at least one role"); },

	invalidUsernameOrPassword: () => { return error(401, errorCode.invalidUsernameOrPassword, "Invalid username or password", "Invalid username or password"); },

	forbidden: (title, detail) => { return error(403, errorCode.forbidden, title || "Forbidden", detail || "Forbidden"); },


	errorCodes: errorCode

};

/**
 * @param {Number} status
 * @param {String} code
 * @param {String} title
 * @param {String} detail
 */
function error(status, code, title, detail) {
	throw Error(status, code, title, detail);
}

/**
 * @param {Number} status
 * @param {String} code
 * @param {String} title
 * @param {String} detail
 */
function Error(status, code, title, detail) {
	const error = {
		status: status,
		error: {
			code: code,
			id: uuid.v4(),
			title: title,
			detail: detail || undefined
		}
	};

	return error;
}
