const bus = require('fruster-bus');
const utils = require('../utils/utils');
const deleteUserHttp = module.exports = {};

let deleteUserService;

deleteUserHttp.init = deleteUser => {
	deleteUserService = deleteUser;
};

deleteUserHttp.handle = request => {
	const id = request.params.id;

	if (!id)
		return utils.errors.paramIdIsRequired();

	return deleteUserService.handle({
		data: {
			id: id
		}
	})
		.then(userResponse => {
			return userResponse;
		});
};