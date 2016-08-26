/*jslint latedef:false, esversion:6*/

"use strict";

var utils = require('./utils/utils');
var database;

var deleteUser = module.exports = {};


deleteUser.init = db => {
	database = db;
};

deleteUser.handle = request => {
	if (!request.data) {
		return utils.badRequest("Invalid json", "Invalid json in request body", 9);
	}

	var id = request.data.id;

	if (!id || !utils.validateId(id)) {
		return utils.badRequest("field id is required", "Field id is missing from request body", 11);
	}

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
			} else {
				return utils.notFound("User not found", "No user with id " + id + " was found", 2);
			}
		});
};