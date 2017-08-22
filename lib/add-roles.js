const conf = require('../config');
const utils = require('./utils/utils');
const _ = require('lodash');
const bus = require("fruster-bus");
const addRoles = module.exports = {};

let database;

addRoles.init = (db) => {
	database = db;
};

addRoles.handle = request => {
	if (!request.data || _.size(request.data) === 0)
		return utils.errors.invalidJson();

	const data = request.data;
	const id = data.id;
	const roles = request.data.roles;

	if (!id)
		return utils.errors.idRequired();

	if (!roles || roles.length === 0 || !(roles instanceof Array))
		return utils.errors.invalidRoles(roles);

	const invalidRoles = utils.validateRoles(data.roles);

	if (invalidRoles.length > 0)
		return utils.errors.invalidRoles(invalidRoles);

	return bus.request("user-service.get-user", {
		reqId: request.reqId,
		data: {
			id: id
		}
	})
		.then(userResp => {
			if (userResp.data.length === 0)
				return utils.errors.userNotFound(id);

			const user = userResp.data[0];
			const rolesToAdd = [];

			roles.forEach(role => {
				if (!user.roles.includes(role))
					rolesToAdd.push(role);
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
			if (response.result.n === 0)
				return utils.errors.userNotFound(id);
			else
				return utils.accepted();
		});
};