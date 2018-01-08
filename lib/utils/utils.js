const conf = require('../../config');
const uuid = require('uuid');

/**
 * Validates that an email is an actual email.
 * 
 * @param {String} email 
 */
function validateEmail(email) {
	return new RegExp(conf.emailValidationRegex).test(email);
}

/**
 * Validates that an id is a uuid.
 * 
 * @param {String} id 
 */
function validateId(id) {
	return new RegExp(conf.idValidationRegex).test(id);
}

function toTitleCase(string) {
	if (string && string.length > 1)
		return string.substring(0, 1).toUpperCase() + string.substring(1);

	return string;
}

/**
 * Returns bad request error object // DEPRECATED
 * 
 * @param {String} title 
 * @param {String} detail 
 * @param {Number} errorCode 
 */
function badRequest(title, detail, errorCode) {
	return {
		status: 400,
		data: {},
		error: {
			code: "user-service.400." + (errorCode || 0),
			title: title || "Bad Request",
			detail: detail || "Bad Request"
		}
	};
}

/**
 * Returns unauthorized request error object // DEPRECATED
 * 
 * @param {Number} errorCode 
 * @param {String} title 
 * @param {String} detail 
 */
function unauthorized(errorCode, title, detail) {
	return {
		status: 401,
		data: {},
		error: {
			code: "user-service.401." + (errorCode || 0),
			title: title,
			detail: detail
		}
	};
}

module.exports = {

	validateEmail,
	validateId,
	toTitleCase,
	badRequest,
	unauthorized

};