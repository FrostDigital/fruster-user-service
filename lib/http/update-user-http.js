/*jslint latedef:false, esversion:6*/

"use strict";

var bus = require('fruster-bus');
var utils = require('../utils/utils');
var _ = require('lodash');
var updateUserService;

var updateUser = module.exports = {};


updateUser.init = updateUser => {
	updateUserService = updateUser;
};

updateUser.handle = request => {
	//TODO: remove this when we get this through the request object
	var id = request.path.replace("/user/", "");
	var requestBody = request.data;
	requestBody.id = id;

	if (!id) {
		return utils.badRequest("Id is required", "id is required", 4);
	}

	return bus.request("user-service.update-user", {
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