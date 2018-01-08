const RoleService = require("../services/RoleService");


class GetScopesHandler {

    /**
     * @param {RoleService} roleService 
     */
    constructor(roleService) {
        this._roleService = roleService;
    }

    handle(req) {
        const roles = req.data;
        const scopesForRoles = this._roleService.getScopesForRoles(roles);

        return {
            status: 200,
            data: scopesForRoles
        };
    }

}

module.exports = GetScopesHandler;