const RoleModel = require("../../models/RoleModel");
const RoleScopesDbRepo = require("../../repos/RoleScopesDbRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;


class AddSystemRoleHandler {

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
        const role = req.data.role;
        const scopes = req.data.scopes || [];

        const createdRole = await this._repo.addRole(role, scopes);

        return {
            status: 200,
            data: createdRole
        };
    }

}

module.exports = AddSystemRoleHandler;