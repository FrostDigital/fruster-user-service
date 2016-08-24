/*jslint latedef:false, esversion:6*/

"use strict";

var conf = require('../../config');
var _ = require('lodash');

var utils = module.exports = {};

utils.getRoles = function () {
	var predefinedRoles = conf.roles.split(";");
	var rolesObject = {};

	predefinedRoles.forEach(role => {
		let roleName = role.substring(0, role.lastIndexOf(":"));
		let permissions = role.substring(role.lastIndexOf(":") + 1).split(",");

		rolesObject[roleName] = permissions;
	});

	return rolesObject;
};

utils.cleanUserModelOutput = function (user) {
	// delete user.password;
	// delete user.salt;
	delete user._id;

	user.scopes = [];

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