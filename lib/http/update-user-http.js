/*jslint latedef:false, esversion:6*/

"use strict";

var bus = require('fruster-bus');
var utils = require('../utils/utils');

var getUserById = module.exports = {};


getUserById.handle = request => {
	//TODO: remove this when we get this through the request object
	var id = request.path.replace("/user/", "");
	var requestBody = request.data;
	requestBody.id = id;

	if (!id) {
		return utils.badRequest(undefined, undefined, 4);
	}

	return bus.request("user-service.update-user", {
			data: requestBody
		})
		.then(userResponse => {
			if (userResponse.data) {
				return utils.ok(userResponse.data);
			} else {
				return utils.badRequest("User not updated", "There was an error when updating the user", 5);
			}
		});
};