var conf = require('../config');
var utils = require('./utils/utils');
var _ = require('lodash');
var bus = require("fruster-bus");
var database;

var removeRoles = module.exports = {};

removeRoles.init = (db) => {
	database = db;
};

removeRoles.handle = request => {
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
			data: {
				id: id
			}
		})
		.then(userResp => {
			var user = userResp.data[0];

			if (user.roles.length === 1 && roles.includes(user.roles[0])) {
				return utils.errors.cannotRemoveLastRole();
			}

			return database
				.update({
					id: id
				}, {
					$pull: {
						roles: {
							$in: roles
						}
					}
				})
				.then(response => {
					if (response.result.n === 0) {
						return utils.errors.userNotFound(id);
					} else {
						return utils.accepted();
					}
				});

		});


};