var utils = require('./utils/utils');
var uuid = require('uuid');
var _ = require('lodash');
var database;

var getUser = module.exports = {};


getUser.init = db => {
	database = db;
};

getUser.handle = request => {
	if (!request.data) {
		return utils.errors.invalidJson();
	}

	var query = request.data;

	if (queryIncludesInvalidFields(query)) {
		return utils.errors.invalidJson();
	}

	return database.find(query)
		.then(users => {
			var usersToReturn = users.map(user => utils.cleanUserModelOutput(user));
			return utils.ok(users);
		});

};

function queryIncludesInvalidFields(query) {
	if (query.password || query.salt) {
		return true;
	} else {
		return false;
	}
}