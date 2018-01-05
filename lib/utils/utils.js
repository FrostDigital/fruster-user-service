const conf = require('../../config');
const _ = require('lodash');
const errors = require('./errors');
const uuid = require('uuid');
const roleUtils = require("./role-utils");

function validateEmail(email) {
	return new RegExp(conf.emailValidationRegex).test(email);
}

function validateEmailIsUnique(email, database, userId) {

	console.error(new Error("DEPRECATED").stack);

	return database
		.findOne({
			'email': email
		})
		.then(result => {
			if (!!result) {
				if (userId)
					return result.id === userId;
				else
					return false;
			} else {
				return true;
			}
		});
}

function badRequest(title, detail, errorCode) {
	return Promise.reject({
		status: 400,
		data: {},
		error: {
			code: "user-service.400." + (errorCode || 0),
			title: title || "Bad Request",
			detail: detail || "Bad Request"
		}
	});
}

function ok(data) {
	return {
		status: 200,
		data: data || {},
		error: {}
	};
}

function accepted(data) {
	return {
		status: 202,
		data: data || {},
		error: {}
	};
}

function notFound(title, detail, errorCode) {
	return Promise.reject({
		status: 404,
		data: {},
		error: {
			code: "user-service.404." + (errorCode || 0),
			title: title || "Not Found",
			detail: detail || "Not Found"
		}
	});
}

function unauthorized(errorCode, title, detail) {
	return Promise.reject({
		status: 401,
		data: {},
		error: {
			code: "user-service.401." + (errorCode || 0),
			title: title,
			detail: detail
		}
	});
}

function validateId(id) {
	return new RegExp(conf.idValidationRegex).test(id);
}

function toTitleCase(string) {
	if (string && string.length > 1)
		return string.substring(0, 1).toUpperCase() + string.substring(1);

	return string;
}

module.exports = {

	validateEmail,
	validateEmailIsUnique,
	badRequest,
	ok,
	accepted,
	notFound,
	unauthorized,
	validateId,
	errors

};