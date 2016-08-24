/*jslint latedef:false, esversion:6*/

"use strict";

var conf = require('../config');
var utils = require('./utils');
var bus = require('fruster-bus');
var uuid = require('uuid');
var passwordUtils = require('./password-utils');
var _ = require('lodash');
var pendingPasswordResets;
var Promise = require('bluebird');
var database;

var createUser = module.exports = {};

var temp = {
	"id": "string",
	"roles": ["string"], //optional?
	"firstName": "string", //required
	"middleName": "string", //optional
	"lastName": "string", //required
	"email": "string", //required
	"password": "string", //required
	"salt": "!string",
	"scopes": ["!string"]
};

createUser.init = db => {
	database = db;
};

createUser.handle = (request, replyTo) => {
	let data = request.data;

	if (!data.firstName) {
		return invalidJsonError("firstName is required", "Field firstName in request body is required");
	}
	if (!data.lastName) {
		return invalidJsonError("lastName is required", "Field lastName in request body is required");
	}
	if (!data.email) {
		return invalidJsonError("email is required", "Field email in request body is required");
	}
	if (!data.password) {
		return invalidJsonError("password is required", "Field password in request body is required");
	} else if (!validatePassword(data.password)) {
		return invalidJsonError("Invalid password", "");
	}
	if (!validateEmail(data.email)) {
		return invalidJsonError("Invalid email", "provided email address is invalid");
	}
	let invalidRoles = validateRoles(data.roles);
	if (invalidRoles.length > 0) {
		return invalidJsonError("Invalid roles", "Roles contains invalid role(s) " + invalidRoles);
	}

	return validateEmailIsUnique(data.email)
		.then(emailIsUnique => {
			if (!emailIsUnique) {
				return invalidJsonError("Email is not unique", "Another account has already been registered with the provided email-address");
			}
		})
		.then(x => {
			let user = new UserModel(data);
			user.id = uuid.v4();
			return user;
		})
		.then(hashPassword)
		.then(saveUser)
		.then(createdUser => {
			return {
				"status": 201,
				"data": createdUser,
				"error": {}
			};
		});
};

var invalidJsonError = (message, detail) => {
	return Promise.reject({
		"status": 400,
		"data": {},
		"error": {
			"id": uuid.v4(),
			"title": message,
			"detail": detail
		}
	});
};

function UserModel(requestBody) {

	this.password = requestBody.password;
	this.firstName = requestBody.firstName;
	this.lastName = requestBody.lastName;
	this.middleName = requestBody.middleName;
	this.email = requestBody.email;

	this.roles = [];

	_.each(requestBody.roles, role => {
		if (!this.roles.includes(role.toLowerCase())) {
			this.roles.push(role.toLowerCase());
		}
	});

}

var validatePassword = password => {
	return new RegExp(conf.passwordValidationRegex).test(password);
};

var validateEmail = email => {
	return new RegExp(conf.emailValidationRegex).test(email);
};

var validateEmailIsUnique = email => {
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

var validateRoles = roles => {
	let invalidRoles = [];

	if (!roles || roles.length === 0) {
		return true;
	}
	let hasValidRoles = true;
	let rolesObject = utils.getRoles();

	_.each(roles, role => {
		if (typeof role === "string" && !rolesObject[role.toLowerCase()]) {
			invalidRoles.push(role);
			hasValidRoles = false;
		}
	});

	return invalidRoles;
};

var hashPassword = user => {
	var hashResponse = passwordUtils.hash(user.email, user.password)

	user.password = hashResponse.hashedPassword;
	user.salt = hashResponse.salt;

	return user;
};

var saveUser = user => {
	return database
		.insert(user)
		.then(createdUser => {
			return utils.cleanUserModelOutput(createdUser.ops[0]);
		});
};