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
		return utils.errors.invalidJson();
	}

	var id = request.data.id;

	if (!id) {
		return utils.errors.idRequired();
	}

	if (!utils.validateId(id)) {
		return utils.errors.invalidId(id);
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
				return utils.errors.userNotFound(id);
			}
		});
};