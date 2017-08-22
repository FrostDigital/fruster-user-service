const bus = require('fruster-bus');
const utils = require('../utils/utils');
const getUserById = module.exports = {};

let getUserService;

getUserById.init = getUser => {
	getUserService = getUser;
};

getUserById.handle = request => {
	const id = request.params.id;

	if (!id || !utils.validateId(id))
		return utils.badRequest("Invalid id", "provided id is invalid : " + id, 3);

	return getUserService.handle({
		data: {
			id: id.toString()
		}
	})
		.then(userResponse => {
			if (userResponse.data.length !== 0) {
				return utils.ok(userResponse.data[0]);
			} else {
				return utils.notFound("User not found", "No user with id " + id + " was found", 1);
			}
		});
};