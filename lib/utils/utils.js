/*jslint latedef:false, esversion:6*/

"use strict";

var conf = require('../../config');
var _ = require('lodash');
var errors = require('../errors');

var utils = module.exports = {};

utils.errors = errors;

utils.UserModel = function (requestBody) {

	this.password = requestBody.password;
	this.firstName = requestBody.firstName ? requestBody.firstName.toLowerCase() : undefined;
	this.lastName = requestBody.lastName ? requestBody.lastName.toLowerCase() : undefined;
	this.middleName = requestBody.middleName ? requestBody.middleName.toLowerCase() : undefined;
	this.email = requestBody.email ? requestBody.email.toLowerCase() : undefined;

	this.roles = [];

	if (requestBody.roles) {
		requestBody.roles.forEach(role => {
			if (!this.roles.includes(role.toLowerCase())) {
				this.roles.push(role.toLowerCase());
			}
		});
	}
};

utils.getRoles = () => {
	var predefinedRoles = conf.roles.split(";");
	var rolesObject = {};

	predefinedRoles.forEach(role => {
		let roleName = role.substring(0, role.lastIndexOf(":"));
		let permissions = role.substring(role.lastIndexOf(":") + 1).split(",");

		rolesObject[roleName] = permissions;
	});

	return rolesObject;
};

utils.cleanUserModelOutput = user => {
	delete user.password;
	delete user.salt;
	delete user._id;

	user.scopes = [];
	user.firstName = toTitleCase(user.firstName);
	user.lastName = toTitleCase(user.lastName);
	user.middleName = user.middleName ? toTitleCase(user.middleName) : undefined;

	var rolesWithPermissions = utils.getRoles();

	user.roles.forEach(role => {
		rolesWithPermissions[role].forEach(permission => {
			if (!user.scopes.includes(permission)) {
				user.scopes.push(permission);
			}
		});
	});

	return user;
};

utils.validateEmail = email => {
	return new RegExp(conf.emailValidationRegex).test(email);
};


utils.validateEmailIsUnique = (email, database) => {
	return database
		.findOne({
			'email': email
		})
		.then(result => {
			if (result) {
				return false;
			} else {
				return true;
			}
		});
};

utils.badRequest = (title, detail, errorCode) => {
	return Promise.reject({
		status: 400,
		data: {},
		error: {
			code: "user-service.400." + (errorCode || 0),
			title: title || "Bad Request",
			detail: detail || "Bad Request"
		}
	});
};

utils.ok = data => {
	return {
		status: 200,
		data: data || {},
		error: {}
	};
};

utils.notFound = (title, detail, errorCode) => {
	return Promise.reject({
		status: 404,
		data: {},
		error: {
			code: "user-service.404." + (errorCode || 0),
			title: title || "Not Found",
			detail: detail || "Not Found"
		}
	});
};

utils.unauthorized = (errorCode) => {
	return Promise.reject({
		status: 401,
		data: {},
		error: {
			code: "user-service.401." + (errorCode || 0),
		}
	});
};

utils.validateId = (id) => {
	return new RegExp(conf.idValidationRegex).test(id);
};

function toTitleCase(string) {
	return string.substring(0, 1).toUpperCase() + string.substring(1);
}