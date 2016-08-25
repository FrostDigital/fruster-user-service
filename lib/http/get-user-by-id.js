/*jslint latedef:false, esversion:6*/

"use strict";

var bus = require('fruster-bus');
var utils = require('../utils/utils');

var getUserById = module.exports = {};


getUserById.handle = (request, replyTo) => {
	//TODO: remove this when we get this through the request object
	var id = request.path.replace("/user/", "");

	if (!id) {
		return utils.badRequest();
	}

	return bus.request("user-service.get-user", {
			data: {
				id: id
			}
		})
		.then(userResponse => {
			if (userResponse.data.length !== 0) {
				return utils.ok(userResponse.data[0]);
			} else {
				return utils.notFound("User not found", "No user with id " + id + " was found");
			}
		});
};