const FrusterRequest = require("fruster-bus").FrusterRequest;
const RoleManager = require("../managers/RoleManager");


class GetScopesForRolesHandler {

    /**
     * @param {RoleManager} roleManager 
     */
    constructor(roleManager) {
        this._roleManager = roleManager;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        const roles = req.data;
        const scopesForRoles = await this._roleManager.getScopesForRoles(roles);

        return {
            status: 200,
            data: scopesForRoles
        };
    }

}

module.exports = GetScopesForRolesHandler;