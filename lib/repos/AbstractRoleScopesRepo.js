const RoleModel = require("../models/RoleModel");
const config = require("../../config");


class AbstractRoleScopesRepo {

    constructor() {
        return null;
    }

    /**
     * @return {Promise<any>}
     */
    async prepareRoles() {
        const predefinedRoles = config.roles.split(";");
        const rolesArray = [];

        predefinedRoles.forEach(role => {
            const roleName = role.substring(0, role.lastIndexOf(":"));
            const permissions = role.substring(role.lastIndexOf(":") + 1).split(",");

            rolesArray.push(new RoleModel(roleName, permissions));
        });

        return rolesArray;
    }

    /**
     * Returns roles w/ scopes.
     * 
     * @return {Promise<Array<RoleModel>>} 
     */
    async getRoles() {
        return null;
    }

    /**
     * Returns a role w/ scopes.
     * 
     * @param {String} role 
     * 
     * @return {Promise<RoleModel>}
     */
    async getRole(role) {
        return null;
    }

    /**
     * Adds a role.
     * 
     * @param {String} role 
     * 
     * @return {Promise<RoleModel>}
     */
    async addRole(role) {
        return null;
    }

    /**
     *  Removes a role.
     * 
     * @param {String} role 
     * 
     * @return {Promise<Void>}
     */
    async removeRole(role) {
        return null;
    }

    /**
     * Adds scope(s) to a specific role.
     * 
     * @param {String} role role to add scope to.
     * @param {Array<String>|String} scopes scope or scopes to add to role.
     * 
     * @return {Promise<RoleModel>}
     */
    async addScopesToRole(role, scopes) {
        return null;
    }

    /**
     * Removes scope(s) to a specific role.
     * 
     * @param {String} role 
     * @param {Array<String>|String} scopes 
     * 
     * @return {Promise<RoleModel>}
     */
    async removeScopesFromRole(role, scopes) {
        return null;
    }

}

module.exports = AbstractRoleScopesRepo;