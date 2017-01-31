var utils = require('./utils/utils');

var getScopes = module.exports = {};

getScopes.handle = request => {

	if (!request.data)
		return utils.errors.invalidJson();

	return utils.ok(utils.getScopesForRoles(request.data));
};