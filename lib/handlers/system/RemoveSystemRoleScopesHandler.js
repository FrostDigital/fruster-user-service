const RoleScopesDbRepo = require("../../repos/RoleScopesDbRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const errors = require("../../errors");


class RemoveSystemRoleScopesHandler {

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
        if (req.data.role === "super-admin" && req.data.scopes.includes("*"))
            throw errors.get("fruster-user-service.CANNOT_DELETE_SUPER_ADMIN");

        const roleRemovedFrom = await this._repo.removeScopesFromRole(req.data.role, req.data.scopes);

        return {
            status: 200,
            data: roleRemovedFrom
        };
    }

}

module.exports = RemoveSystemRoleScopesHandler;