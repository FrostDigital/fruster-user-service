/*jslint latedef:false, esversion:6*/

"use strict";

var bus = require('fruster-bus');
var utils = require('../utils/utils');
var getUsersService;

var getUserById = module.exports = {};


getUserById.init = getUsers => {
	getUsersService = getUsers;
};

getUserById.handle = request => {
	return getUsersService.handle({
			data: {}
		})
		.then(userResponse => {
			return utils.ok(userResponse.data);
		});
};