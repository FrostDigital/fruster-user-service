const utils = require('./utils/utils');
const roleUtils = require("./utils/role-utils");

const getScopes = module.exports = {};

getScopes.handle = request => {
	if (!request.data)
		throw utils.errors.invalidJson();

	return utils.ok(roleUtils.getScopesForRoles(request.data));
};