const RoleScopesDbRepo = require("../../repos/RoleScopesDbRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;


class AddSystemRoleScopesHandler {

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
        const roleAddedTo = await this._repo.addScopesToRole(req.data.role, req.data.scopes);

        return {
            status: 200,
            data: roleAddedTo
        };
    }

}

module.exports = AddSystemRoleScopesHandler;