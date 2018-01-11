const RoleModel = require("../../models/RoleModel");
const RoleScopesDbRepo = require("../../repos/RoleScopesDbRepo");


class AddSystemRoleHandler {

    /**
     * @param {RoleScopesDbRepo} roleScopesDbRepo 
     */
    constructor(roleScopesDbRepo) {
        this._repo = roleScopesDbRepo;
    }

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