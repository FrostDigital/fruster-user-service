const utils = require('./utils/utils');
const uuid = require('uuid');
const _ = require('lodash');
const getUser = module.exports = {};

let database;

getUser.init = db => {
	database = db;
};

getUser.handle = request => {
	if (!request.data)
		return utils.errors.invalidJson();

	const query = request.data;

	if (queryIncludesInvalidFields(query))
		return utils.errors.invalidJson();

	return database.find(query)
		.catch(() => {
			return [];
		})
		.then(users => {
			var usersToReturn = users.map(user => utils.cleanUserModelOutput(user));
			return utils.ok(users);
		});
};

function queryIncludesInvalidFields(query) {
	if (query.password || query.salt)
		return true;
	else
		return false;
}