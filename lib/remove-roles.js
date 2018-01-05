const conf = require('../config');
const utils = require('./utils/utils');
const _ = require('lodash');
const bus = require("fruster-bus");
const removeRoles = module.exports = {};
const roleUtils = require("./utils/role-utils");

let database;

removeRoles.init = (db) => {
	database = db;
};

removeRoles.handle = request => {
	if (!request.data || _.size(request.data) === 0)
		throw utils.errors.invalidJson();

	const data = request.data;
	const id = data.id;
	const roles = request.data.roles;

	if (!id)
		throw utils.errors.idRequired();

	if (!roles || roles.length === 0 || !(roles instanceof Array))
		throw utils.errors.invalidRoles(roles);

	const invalidRoles = roleUtils.validateRoles(data.roles);

	if (invalidRoles.length > 0)
		throw utils.errors.invalidRoles(invalidRoles);

	return bus.request("user-service.get-user", {
		reqId: request.reqId,
		data: {
			id: id
		}
	})
		.then(userResp => {
			if (userResp.data.length === 0)
				throw utils.errors.userNotFound(id);

			const user = userResp.data[0];

			if (user.roles.length === 1 && roles.includes(user.roles[0]))
				throw utils.errors.cannotRemoveLastRole();

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
					if (response.result.n === 0)
						throw utils.errors.userNotFound(id);
					else
						return utils.accepted();
				});

		});
};