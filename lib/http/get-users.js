/*jslint latedef:false, esversion:6*/

"use strict";

var bus = require('fruster-bus');
var utils = require('../utils/utils');

var getUserById = module.exports = {};


getUserById.handle = request => {
	return bus.request("user-service.get-user", {
			data: {}
		})
		.then(userResponse => {
			return utils.ok(userResponse.data);
		});
};