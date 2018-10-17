const RoleScopesDbRepo = require("../../repos/RoleScopesDbRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const errors = require("../../errors");


class RemoveSystemRoleHandler {

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
        if (req.data.role === "super-admin")
            throw errors.get("fruster-user-service.CANNOT_DELETE_SUPER_ADMIN");

        await this._repo.removeRole(req.data.role);

        return {
            status: 200
        };
    }

}

module.exports = RemoveSystemRoleHandler;