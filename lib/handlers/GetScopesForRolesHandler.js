const FrusterRequest = require("fruster-bus").FrusterRequest;
const RoleService = require("../services/RoleService");


class GetScopesForRolesHandler {

    /**
     * @param {RoleService} roleService 
     */
    constructor(roleService) {
        this._roleService = roleService;
    }

    /**
     * @param {FrusterRequest} req 
     */
    handle(req) {
        const roles = req.data;
        const scopesForRoles = this._roleService.getScopesForRoles(roles);

        return {
            status: 200,
            data: scopesForRoles
        };
    }

}

module.exports = GetScopesForRolesHandler;