const conf = require('../../config');
const _ = require('lodash');
const errors = require('./errors');

const utils = module.exports = {};

utils.errors = errors;

utils.UserModel = function (requestBody) {
	const user = requestBody;

	user.password = requestBody.password;
	user.firstName = requestBody.firstName ? requestBody.firstName.toLowerCase() : undefined;
	user.lastName = requestBody.lastName ? requestBody.lastName.toLowerCase() : undefined;
	user.middleName = requestBody.middleName ? requestBody.middleName.toLowerCase() : undefined;
	user.email = requestBody.email ? requestBody.email.toLowerCase() : undefined;

	const roles = [];

	if (requestBody.roles) {
		requestBody.roles.forEach(role => {
			if (!roles.includes(role)) {
				roles.push(role);
			}
		});
	}

	user.roles = roles;

	return user;
};

utils.getRoles = () => {
	const predefinedRoles = conf.roles.split(";");
	const rolesObject = {};

	predefinedRoles.forEach(role => {
		const roleName = role.substring(0, role.lastIndexOf(":"));
		const permissions = role.substring(role.lastIndexOf(":") + 1).split(",");

		rolesObject[roleName] = permissions;
	});

	return rolesObject;
};

/**
 * @return {Array}
 */
utils.validateRoles = (roles) => {
	const invalidRoles = [];

	if (!roles || roles.length === 0) {
		return true;
	}
	let hasValidRoles = true;
	const rolesObject = utils.getRoles();

	roles.forEach(role => {
		if (typeof role !== "string" || (!rolesObject[role])) {
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
	delete user.emailVerificationToken;
	delete user.hashDate;

	user.scopes = [];
	user.firstName = toTitleCase(user.firstName);
	user.lastName = toTitleCase(user.lastName);
	user.middleName = user.middleName ? toTitleCase(user.middleName) : undefined;

	const rolesWithPermissions = utils.getRoles();

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

/**
 * @return {Array}
 */
utils.getScopesForRoles = roles => {
	const scopes = [];
	const rolesWithPermissions = utils.getRoles();

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
	if (string && string.length > 1)
		return string.substring(0, 1).toUpperCase() + string.substring(1);

	return string;
}