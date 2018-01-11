const RoleModel = require("../models/RoleModel");


class AbstractRoleScopesRepo {

    constructor() { return null; }

    /**
     * Returns roles w/ scopes.
     * 
     * @return {Promise<Array<RoleModel>}
     */
    async getRoles() { return null; }

    /**
     * Returns a role w/ scopes.
     * 
     * @param {String} role 
     * 
     * @return {Promise<RoleModel>}
     */
    async getRole(role) { return null; }

    /**
     * Adds a role.
     * 
     * @param {String} role 
     * 
     * @return {Promise<RoleModel>}
     */
    async addRole(role) { return null; }

    /**
     *  Removes a role.
     * 
     * @param {String} role 
     * 
     * @return {Promise<Void>}
     */
    async removeRole(role) { return null; }

    /**
     * Adds scope(s) to a specific role.
     * 
     * @param {String} role role to add scope to.
     * @param {Array<String>|String} scopes scope or scopes to add to role.
     * 
     * @return {Promise<RoleModel>}
     */
    async addScopeToRole(role, scopes) { return null; }

    /**
     * Removes scope(s) to a specific role.
     * 
     * @param {String} role 
     * @param {Array<String>|String} scopes 
     * 
     * @return {Promise<RoleModel>}
     */
    async removeScopeFromRole(role, scopes) { return null; }

}

module.exports = AbstractRoleScopesRepo;