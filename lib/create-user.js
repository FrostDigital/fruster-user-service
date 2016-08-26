/*jslint latedef:false, esversion:6*/

"use strict";

var conf = require('../config');
var utils = require('./utils/utils');
var bus = require('fruster-bus');
var uuid = require('uuid');
var passwordUtils = require('./utils/password-utils');
var _ = require('lodash');
var Promise = require('bluebird');
var database;

var createUser = module.exports = {};

createUser.init = db => {
	database = db;
};


//TODO: add status ? => active, inactive, verified etc?
createUser.handle = (request, replyTo) => {
	let data = request.data;

	if (!data.firstName) {
		return invalidJsonError("firstName is required", "Field firstName in request body is required", 1);
	}
	if (!data.lastName) {
		return invalidJsonError("lastName is required", "Field lastName in request body is required", 2);
	}
	if (!data.email) {
		return invalidJsonError("email is required", "Field email in request body is required", 3);
	}
	if (!data.password) {
		return invalidJsonError("password is required", "Field password in request body is required", 4);
	} else if (!validatePassword(data.password)) {
		return invalidJsonError("Invalid password", "", 5);
	}
	if (!validateEmail(data.email)) {
		return invalidJsonError("Invalid email", "provided email address is invalid: " + data.email, 6);
	}
	let invalidRoles = validateRoles(data.roles);
	if (invalidRoles.length > 0) {
		return invalidJsonError("Invalid roles", "Roles contains invalid role(s) " + invalidRoles, 7);
	}

	return validateEmailIsUnique(data.email)
		.then(emailIsUnique => {
			if (!emailIsUnique) {
				return invalidJsonError("Email is not unique", "Another account has already been registered with the provided email-address: " + data.email, 8);
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

function invalidJsonError(message, detail, number) {
	return Promise.reject({
		"status": 400,
		"data": {},
		"error": {
			"code": 'user-service.400.' + number,
			"id": uuid.v4(),
			"title": message,
			"detail": detail
		}
	});
}

function UserModel(requestBody) {

	this.password = requestBody.password;
	this.firstName = requestBody.firstName;
	this.lastName = requestBody.lastName;
	this.middleName = requestBody.middleName;
	this.email = requestBody.email;

	this.roles = [];

	requestBody.roles.forEach(role => {
		if (!this.roles.includes(role.toLowerCase())) {
			this.roles.push(role.toLowerCase());
		}
	});

}

function validatePassword(password) {
	return new RegExp(conf.passwordValidationRegex).test(password);
}

function validateEmail(email) {
	return new RegExp(conf.emailValidationRegex).test(email);
}

function validateEmailIsUnique(email) {
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
}

function validateRoles(roles) {
	let invalidRoles = [];

	if (!roles || roles.length === 0) {
		return true;
	}
	let hasValidRoles = true;
	let rolesObject = utils.getRoles();

	roles.forEach(role => {
		if (typeof role !== "string" || !rolesObject[role.toLowerCase()]) {
			invalidRoles.push(role);
			hasValidRoles = false;
		}
	});

	return invalidRoles;
}

function hashPassword(user) {
	var hashResponse = passwordUtils.hash(user.id, user.password);

	user.password = hashResponse.hashedPassword;
	user.salt = hashResponse.salt;

	return user;
}

function saveUser(user) {
	return database
		.insert(user)
		.then(createdUser => {
			return utils.cleanUserModelOutput(createdUser.ops[0]);
		});
}