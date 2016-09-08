"use strict";

var bus = require('fruster-bus');
var utils = require('../utils/utils');
var deleteUserService;

var deleteUserHttp = module.exports = {};


deleteUserHttp.init = deleteUser => {
	deleteUserService = deleteUser;
};

deleteUserHttp.handle = request => {
	var id = request.path.replace("/admin/user/", "");

	if (!id) {
		return utils.errors.paramIdIsRequired("id is required", "Param id is required", 9);
	}

	return deleteUserService.handle({
			data: {
				id: id
			}
		})
		.then(userResponse => {
			return userResponse;
		});
};