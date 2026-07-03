/**
 * DEPRECATED ERRORS.
 * New development should never use these!
 * ...one day we might be able to remove this once and for all.
 */

import { v4 as uuidv4 } from "uuid";

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

interface DeprecatedError {
	status: number;
	error: {
		code: string;
		id: string;
		title: string;
		detail: string | undefined;
	};
}

/**
 * Builds an error object. Mirrors the legacy `Error()` factory — does NOT throw.
 */
const buildError = (status: number, code: string, title: string, detail?: string): DeprecatedError => {
	return {
		status: status,
		error: {
			code: code,
			id: uuidv4(),
			title: title,
			detail: detail || undefined
		}
	};
};

/**
 * Builds and throws an error object. Mirrors the legacy `error()` factory.
 */
const throwError = (status: number, code: string, title: string, detail?: string): never => {
	throw buildError(status, code, title, detail);
};

const deprecatedErrors = {

	/** @return {Error} */
	userNotFound: (id: string) => { return throwError(404, errorCode.userNotFound, "User not found", "User with id " + id + " was not found"); },

	invalidPassword: () => { return throwError(400, errorCode.invalidPassword, "Invalid password", "Password is invalid"); },

	invalidRoles: (roles: string[]) => { return throwError(400, errorCode.invalidRoles, "Invalid roles", "Roles contains invalid role(s) " + roles); },

	invalidEmail: (email: string) => { return throwError(400, errorCode.invalidEmail, "Invalid email", "Email " + email + " is invalid"); },

	cannotUpdatePassword: () => { return throwError(400, errorCode.cannotUpdatePassword, "Cannot update password", "Cannot update password through user update"); },

	passwordRequired: () => { return throwError(400, errorCode.passwordRequired, "password is required", "Field password in request body is required"); },

	emailNotUnique: (email: string) => { return buildError(400, errorCode.emailNotUnique, "Email is not unique", "Another account has already been registered with the provided email-address: " + email); },

	invalidJson: () => { return throwError(400, errorCode.invalidJson, "Invalid json", "Invalid json in request body"); },

	cannotRemoveLastRole: () => { return throwError(400, errorCode.cannotRemoveLastRole, "Cannot remove last role", "User must have at least one role"); },

	invalidUsernameOrPassword: () => { return throwError(401, errorCode.invalidUsernameOrPassword, "Invalid username or password", "Invalid username or password"); },

	forbidden: (title?: string, detail?: string) => { return throwError(403, errorCode.forbidden, title || "Forbidden", detail || "Forbidden"); },


	errorCodes: errorCode

};

export default deprecatedErrors;
