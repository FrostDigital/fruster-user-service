/*jslint latedef:false, esversion:6*/

var uuid = require("uuid");

const serviceId = "user-service";

const errorCode = {

	userNotFound: serviceId + ".404.1",

	userNotUpdated: serviceId + ".400.1",

	paramIdIsRequired: serviceId + ".400.2"
};

module.exports = {

	userNotFound: id => {
		return error(404, errorCode.userNotFound, "User not found", "User with id " + id + " was not found");
	},

	userNotUpdated: () => {
		return error(400, errorCode.userNotFound, "User was not updated", "User was not updated - Unknown error");
	},

	paramIdIsRequired: () => {
		return error(400, errorCode.paramIdIsRequired, "Param Id is required", "Param id is required");
	}

};

function error(status, code, title, detail) {
	return Promise.reject(new Error(status, code, title, detail));
}

function Error(status, code, title, detail) {
	var error = {
		status: status,
		error: {
			code: code,
			id: uuid.v4(),
			title: title,
			detail: detail || undefined
		}
	};

	return error;
}