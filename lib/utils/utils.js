/*jslint latedef:false, esversion:6*/

"use strict";

var conf = require('../../config');
var _ = require('lodash');

var utils = module.exports = {};

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

utils.badRequest = (title, detail) => {
	return Promise.reject({
		status: 400,
		data: {},
		error: {
			status: 400,
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

utils.notFound = (title, detail) => {
	return Promise.reject({
		status: 404,
		data: {},
		error: {
			status: 404,
			title: title || "Not Found",
			detail: detail || "Not Found"
		}
	});
};

utils.unauthorized = () => {
	return Promise.reject({
		status: 401,
		data: {},
		error: {}
	});
};

function toTitleCase(string) {
	return string.substring(0, 1).toUpperCase() + string.substring(1);
}