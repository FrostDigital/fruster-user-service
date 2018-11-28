const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const RoleManager = require("../managers/RoleManager");
const deprecatedErrors = require("../deprecatedErrors");


class RemoveRolesHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {RoleManager} roleManager 
     */
    constructor(userRepo, roleManager) {
        this._repo = userRepo;
        this._roleManager = roleManager;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        const id = req.data.id;
        const roles = req.data.roles;
        const invalidRoles = await this._roleManager.validateRoles(roles);

        if (invalidRoles.length > 0)
            throw deprecatedErrors.invalidRoles(invalidRoles);

        const user = await this._repo.getById(id);

        if (user.roles.length === 1 && roles.includes(user.roles[0]))
            throw deprecatedErrors.cannotRemoveLastRole();

        await this._repo.removeRolesForUser(id, roles);

        return {
            status: 202
        };
    }

}

module.exports = RemoveRolesHandler;