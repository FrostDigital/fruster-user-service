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
    async handle(req) {
        const roles = req.data;
        const scopesForRoles = await this._roleService.getScopesForRoles(roles);

        return {
            status: 200,
            data: scopesForRoles
        };
    }

}

module.exports = GetScopesForRolesHandler;