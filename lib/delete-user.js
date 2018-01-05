const utils = require('./utils/utils');
const deleteUser = module.exports = {};

let database;

deleteUser.init = db => {
	database = db;
};

deleteUser.handle = request => {
	if (!request.data)
		throw utils.errors.invalidJson();

	const id = request.data.id;

	if (!id)
		throw utils.errors.idRequired();

	if (!utils.validateId(id))
		throw utils.errors.invalidId(id);

	return database.remove({
		id: id
	})
		.then(response => {
			if (response.result.n > 0) {
				return {
					status: 200,
					data: {},
					error: {}
				};
			} else
				throw utils.errors.userNotFound(id);
		});
};