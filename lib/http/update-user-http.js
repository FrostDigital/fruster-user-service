const bus = require('fruster-bus');
const utils = require('../utils/utils');
const _ = require('lodash');
const updateUser = module.exports = {};

let updateUserService;

updateUser.init = updateUser => {
	updateUserService = updateUser;
};

updateUser.handle = request => {
	const id = request.params.id;
	const requestBody = request.data;
	requestBody.id = id;

	if (!id)
		return utils.badRequest("Id is required", "id is required", 4);

	return bus.request("user-service.update-user", {
		reqId: request.reqId,
		data: requestBody
	})
		.then(userResponse => {
			if (_.size(userResponse.data) > 0) {
				return utils.ok(userResponse.data);
			} else {
				return userResponse;
			}
		});
};