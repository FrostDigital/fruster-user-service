const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const RoleService = require("../services/RoleService");
const errors = require("../utils/errors");


class RemoveRolesHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {RoleService} roleService 
     */
    constructor(userRepo, roleService) {
        this._repo = userRepo;
        this._roleService = roleService;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        const id = req.data.id;
        const roles = req.data.roles;

        const invalidRoles = this._roleService.validateRoles(roles);

        if (invalidRoles.length > 0)
            throw errors.invalidRoles(invalidRoles);

        const user = await this._repo.getById(id);

        if (user.roles.length === 1 && roles.includes(user.roles[0]))
            throw errors.cannotRemoveLastRole();

        const rolesToRemove = [];

        await this._repo.removeRolesForUser(id, roles);

        return {
            status: 202
        };
    }

}

module.exports = RemoveRolesHandler;