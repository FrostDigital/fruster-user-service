const config = require("../../config");


class RoleService {

    constructor() { }


    /**
     * Returns all roles possible to have w/ the current configuration.. 
     */
    getRoles() {
        const predefinedRoles = config.roles.split(";");
        const rolesObject = {};

        predefinedRoles.forEach(role => {
            const roleName = role.substring(0, role.lastIndexOf(":"));
            const permissions = role.substring(role.lastIndexOf(":") + 1).split(",");

            rolesObject[roleName] = permissions;
        });

        return rolesObject;
    }

    /**
     * Checks all roles inputted and returns all roles that are not matching configured roles.
     * 
     * @param {Array<String>} roles
     * 
     * @return {Array<String>}
     */
    validateRoles(roles) {
        if (!roles || roles.length === 0)
            return [];

        const invalidRoles = [];
        const rolesObject = this.getRoles();

        roles.forEach(role => {
            if (!rolesObject[role]) {
                invalidRoles.push(role);
            }
        });

        return invalidRoles;
    }


    /**
     * @return {Array}
     */
    getScopesForRoles(roles) {
        const scopes = [];
        const rolesWithPermissions = this.getRoles();

        roles.forEach(role => {
            if (rolesWithPermissions[role]) {
                rolesWithPermissions[role].forEach(permission => {
                    if (!scopes.includes(permission)) {
                        scopes.push(permission);
                    }
                });
            }
        });

        return scopes;
    }

}

module.exports = RoleService;