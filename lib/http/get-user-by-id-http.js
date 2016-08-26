/*jslint latedef:false, esversion:6*/

"use strict";

var bus = require('fruster-bus');
var utils = require('../utils/utils');
var getUserService;

var getUserById = module.exports = {};


getUserById.init = getUser => {
	getUserService = getUser;
};

getUserById.handle = request => {
	//TODO: remove this when we get this through the request object
	var id = request.path.replace("/user/", "");

	if (!id || !utils.validateId(id)) {
		return utils.badRequest("Invalid id", "provided id is invalid : " + id, 3);
	}

	//TODO: call service right away instead of going over the bus?
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