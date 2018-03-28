const config = require("../../config");
const AbstractRoleScopesRepo = require("../repos/AbstractRoleScopesRepo");
const RoleScopesConfigRepo = require("../repos/RoleScopesConfigRepo");


class RoleManager {

    /**
     * @param {AbstractRoleScopesRepo=} roleScopesRepo which role scopes repo to use, defaults to RoleScopesConfigRepo
     */
    constructor(roleScopesRepo = new RoleScopesConfigRepo()) {
        this._roleScopesRepo = roleScopesRepo;
    }

    /**
     * Returns all roles possible to have w/ the current configuration.. 
     */
    async getRoles() {
        const roles = await this._roleScopesRepo.getRoles();
        const rolesObject = {};

        roles.forEach(roleObj => {
            rolesObject[roleObj.role] = roleObj.scopes;
        });

        return rolesObject;
    }

    /**
     * Checks all roles inputted and returns all roles that are not matching configured roles.
     * 
     * @param {Array<String>} roles
     * 
     * @return {Promise<Array<String>>}
     */
    async validateRoles(roles) {
        if (!roles || roles.length === 0)
            return [];

        const invalidRoles = [];
        const rolesObject = await this.getRoles();

        roles.forEach(role => {
            if (!rolesObject[role]) {
                invalidRoles.push(role);
            }
        });

        return invalidRoles;
    }

    /**
     * Gets all scopes from config for all roles inputted. 
     * 
     * @param {Array<String>} roles
     * 
     * @return {Promise<Array<String>>}
     */
    async getScopesForRoles(roles) {
        const scopes = [];
        const rolesWithPermissions = await this.getRoles();

        roles.forEach(role => {
            if (rolesWithPermissions[role]) {
                rolesWithPermissions[role]
                    .forEach(permission => {
                        if (!scopes.includes(permission)) {
                            scopes.push(permission);
                        }
                    });
            }
        });

        return scopes;
    }

}

module.exports = RoleManager;