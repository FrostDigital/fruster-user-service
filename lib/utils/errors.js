const uuid = require("uuid");
const serviceId = "user-service";
const errorCode = {

	userNotFound: serviceId + ".404.1",
	userNotUpdated: serviceId + ".400.1",
	paramIdIsRequired: serviceId + ".400.2",
	invalidPassword: serviceId + ".400.3",
	invalidRoles: serviceId + ".400.4",
	invalidEmail: serviceId + ".400.5",
	emailRequired: serviceId + ".400.6",
	passwordRequired: serviceId + ".400.7",
	lastNameRequired: serviceId + ".400.8",
	firstNameRequired: serviceId + ".400.9",
	emailNotUnique: serviceId + ".400.10",
	idRequired: serviceId + ".400.11",
	invalidId: serviceId + ".400.12",
	invalidJson: serviceId + ".400.13",
	cannotRemoveLastRole: serviceId + ".400.14",

	forbidden: serviceId + ".403.1"

};

module.exports = {

	userNotFound: id => { return error(404, errorCode.userNotFound, "User not found", "User with id " + id + " was not found"); },

	userNotUpdated: (fields) => { return error(400, errorCode.userNotUpdated, "User was not updated", `The user's fields ${fields.filter(key => key !== "id")} already have the inputted values`); },

	paramIdIsRequired: () => { return error(400, errorCode.paramIdIsRequired, "Param Id is required", "Param id is required"); },

	invalidPassword: () => { return error(400, errorCode.invalidPassword, "Invalid password", "Password is invalid"); },

	invalidRoles: (roles) => { return error(400, errorCode.invalidRoles, "Invalid roles", "Roles contains invalid role(s) " + roles); },

	invalidEmail: (email) => { return error(400, errorCode.invalidEmail, "Invalid email", "Email " + email + " is invalid"); },

	emailRequired: () => { return error(400, errorCode.emailRequired, "email is required", "Field email in request body is required"); },

	passwordRequired: () => { return error(400, errorCode.passwordRequired, "password is required", "Field password in request body is required"); },

	firstNameRequired: () => { return error(400, errorCode.firstNameRequired, "firstName is required", "Field firstName in request body is required"); },

	lastNameRequired: () => { return error(400, errorCode.lastNameRequired, "lastName is required", "Field lastName in request body is required"); },

	emailNotUnique: (email) => { return error(400, errorCode.emailNotUnique, "Email is not unique", "Another account has already been registered with the provided email-address: " + email); },

	idRequired: () => { return error(400, errorCode.idRequired, "id is required", "Field id in request body is required"); },

	invalidId: (id) => { return error(400, errorCode.invalidId, "Invalid id", "id " + id + " is invalid"); },

	invalidJson: () => { return error(400, errorCode.invalidJson, "Invalid json", "Invalid json in request body"); },

	cannotRemoveLastRole: () => { return error(400, errorCode.cannotRemoveLastRole, "Cannot remove last role", "User must have at least one role"); },

	forbidden: (title, detail) => { return error(403, errorCode.forbidden, title || "Forbidden", detail || "Forbidden"); }

};

function error(status, code, title, detail) {
	throw Error(status, code, title, detail);
}

function Error(status, code, title, detail) {
	var error = {
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