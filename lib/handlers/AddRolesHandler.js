const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserRepo = require("../repos/UserRepo");
const RoleService = require("../services/RoleService");
const errors = require("../utils/errors");


class AddRolesHandler {

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

        if (!id)
            throw errors.idRequired();

        if (!roles || roles.length === 0 || !(roles instanceof Array))
            throw errors.invalidRoles(roles);

        const invalidRoles = this._roleService.validateRoles(roles);

        if (invalidRoles.length > 0)
            throw errors.invalidRoles(invalidRoles);

        const user = await this._repo.getById(id);

        if (!user)
            throw errors.userNotFound(id);

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