const RoleScopesDbRepo = require("../../repos/RoleScopesDbRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;

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
        const roleRemovedFrom = await this._repo.removeScopesFromRole(req.params.role, req.data.scopes);

        return {
            status: 200,
            data: roleRemovedFrom
        };
    }

}

module.exports = RemoveSystemRoleScopesHandler;