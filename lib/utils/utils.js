const conf = require('../../config'),
	_ = require('lodash'),
	errors = require('./errors'),

	utils = module.exports = {};

utils.errors = errors;

utils.UserModel = function (requestBody) {
	var user = requestBody;

	user.password = requestBody.password;
	user.firstName = requestBody.firstName ? requestBody.firstName.toLowerCase() : undefined;
	user.lastName = requestBody.lastName ? requestBody.lastName.toLowerCase() : undefined;
	user.middleName = requestBody.middleName ? requestBody.middleName.toLowerCase() : undefined;
	user.email = requestBody.email ? requestBody.email.toLowerCase() : undefined;

	var roles = [];

	if (requestBody.roles) {
		requestBody.roles.forEach(role => {
			if (!roles.includes(role.toLowerCase())) {
				roles.push(role.toLowerCase());
			}
		});
	}

	user.roles = roles;

	return user;
};

utils.getRoles = () => {
	var predefinedRoles = conf.roles.split(";");
	var rolesObject = {};

	predefinedRoles.forEach(role => {
		let roleName = role.substring(0, role.lastIndexOf(":"));
		let permissions = role.substring(role.lastIndexOf(":") + 1).split(",");

		rolesObject[roleName] = permissions;
	});

	return rolesObject;
};

utils.validateRoles = (roles) => {
	let invalidRoles = [];

	if (!roles || roles.length === 0) {
		return true;
	}
	let hasValidRoles = true;
	let rolesObject = utils.getRoles();

	roles.forEach(role => {
		if (typeof role !== "string" || !rolesObject[role.toLowerCase()]) {
			invalidRoles.push(role);
			hasValidRoles = false;
		}
	});

	return invalidRoles;
};

utils.cleanUserModelOutput = user => {
	delete user.password;
	delete user.salt;
	delete user._id;

	user.scopes = [];
	user.firstName = toTitleCase(user.firstName);
	user.lastName = toTitleCase(user.lastName);
	user.middleName = user.middleName ? toTitleCase(user.middleName) : undefined;

	var rolesWithPermissions = utils.getRoles();

	user.roles.forEach(role => {
		if (rolesWithPermissions[role]) {
			rolesWithPermissions[role].forEach(permission => {
				if (!user.scopes.includes(permission)) {
					user.scopes.push(permission);
				}
			});
		}
	});

	return user;
};

utils.getScopesForRoles = roles => {
	let scopes = [];
	var rolesWithPermissions = utils.getRoles();

	roles.forEach(role => {
		if (rolesWithPermissions[role]) {
			rolesWithPermissions[role].forEach(permission => {
				if (!scopes.includes(permission)) {
					scopes.push(permission);
				}
			});
		}
	});

	return scopes;
};

utils.validateEmail = email => {
	return new RegExp(conf.emailValidationRegex).test(email);
};

utils.validateEmailIsUnique = (email, database, userId) => {
	return database
		.findOne({
			'email': email
		})
		.then(result => {
			if (!!result) {
				if (userId)
					return result.id === userId;
				else
					return false;
			} else {
				return true;
			}
		});
};

utils.badRequest = (title, detail, errorCode) => {
	return Promise.reject({
		status: 400,
		data: {},
		error: {
			code: "user-service.400." + (errorCode || 0),
			title: title || "Bad Request",
			detail: detail || "Bad Request"
		}
	});
};

utils.ok = data => {
	return {
		status: 200,
		data: data || {},
		error: {}
	};
};

utils.accepted = data => {
	return {
		status: 202,
		data: data || {},
		error: {}
	};
};

utils.notFound = (title, detail, errorCode) => {
	return Promise.reject({
		status: 404,
		data: {},
		error: {
			code: "user-service.404." + (errorCode || 0),
			title: title || "Not Found",
			detail: detail || "Not Found"
		}
	});
};

utils.unauthorized = (errorCode, title, detail) => {
	return Promise.reject({
		status: 401,
		data: {},
		error: {
			code: "user-service.401." + (errorCode || 0),
			title: title,
			detail: detail
		}
	});
};

utils.validateId = (id) => {
	return new RegExp(conf.idValidationRegex).test(id);
};

function toTitleCase(string) {
	if(string && string.length > 1) {
		return string.substring(0, 1).toUpperCase() + string.substring(1);		
	}
	return string;
}