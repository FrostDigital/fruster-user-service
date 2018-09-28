const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserRepo = require("../repos/UserRepo");
const RoleManager = require("../managers/RoleManager");
const deprecatedErrors = require("../deprecatedErrors");


class AddRolesHandler {

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

        if (!user)
            throw deprecatedErrors.userNotFound(id);

        const rolesToAdd = [];

        roles.forEach(role => {
            if (!user.roles.includes(role))
                rolesToAdd.push(role);
        });

        await this._repo.addRolesForUser(id, rolesToAdd);

        return {
            status: 202
        };
    }

}

module.exports = AddRolesHandler;