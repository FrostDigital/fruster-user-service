var conf = require('../config');
var utils = require('./utils/utils');
var _ = require('lodash');
var bus = require("fruster-bus");
var database;

var addRoles = module.exports = {};

addRoles.init = (db) => {
	database = db;
};

addRoles.handle = request => {
	if (!request.data || _.size(request.data) === 0) {
		return utils.errors.invalidJson();
	}

	let data = request.data;
	let id = data.id;
	let roles = request.data.roles;

	if (!id) {
		return utils.errors.idRequired();
	}

	if (!roles || roles.length === 0 || !(roles instanceof Array)) {
		return utils.errors.invalidRoles(roles);
	}

	let invalidRoles = utils.validateRoles(data.roles);
	if (invalidRoles.length > 0) {
		return utils.errors.invalidRoles(invalidRoles);
	}

	return bus.request("user-service.get-user", {
			reqId: request.reqId,
			data: {
				id: id
			}
		})
		.then(userResp => {
			if (userResp.data.length === 0) {
				return utils.errors.userNotFound(id);
			}

			let user = userResp.data[0];
			let rolesToAdd = [];

			roles.forEach(role => {
				if (!user.roles.includes(role)) {
					rolesToAdd.push(role);
				}
			});

			return database
				.update({
					id: id
				}, {
					$push: {
						roles: {
							$each: rolesToAdd
						}
					}
				});
		})
		.then(response => {
			if (response.result.n === 0) {
				return utils.errors.userNotFound(id);
			} else {
				return utils.accepted();
			}
		});
};