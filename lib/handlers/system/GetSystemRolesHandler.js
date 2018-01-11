const RoleModel = require("../../models/RoleModel");
const RoleScopesDbRepo = require("../../repos/RoleScopesDbRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;


class GetSystemRolesHandler {

    /**
     * @param {RoleScopesDbRepo} roleScopesDbRepo 
     */
    constructor(roleScopesDbRepo) {
        this._repo = roleScopesDbRepo;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        const roles = await this._repo.getRoles();

        return {
            status: 200,
            data: roles
        };
    }

}

module.exports = GetSystemRolesHandler;