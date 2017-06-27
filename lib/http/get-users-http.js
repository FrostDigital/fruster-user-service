const bus = require('fruster-bus');
const utils = require('../utils/utils');
const getUserById = module.exports = {};

let getUsersService;

getUserById.init = getUsers => {
	getUsersService = getUsers;
};

getUserById.handle = request => {
	return getUsersService.handle({
		data: {}
	})
		.then(userResponse => {
			return utils.ok(userResponse.data);
		});
};