const AbstractRoleScopesRepo = require("./AbstractRoleScopesRepo");
const RoleModel = require("../models/RoleModel");
const config = require("../../config");


/**
 * RoleScopesRepo getting its data from the config.
 */
class RoleScopesConfigRepo extends AbstractRoleScopesRepo {

    constructor() {
        super();
        /** @type {Array<RoleModel>} */
        this._rolesArray = [];
    }

    /**
     * Returns roles w/ scopes.
     * 
     * @return {Promise<Array<RoleModel>}
     */
    async getRoles() {
        if (this._rolesArray.length === 0) {
            const predefinedRoles = config.roles.split(";");
            const rolesArray = [];

            predefinedRoles.forEach(role => {
                const roleName = role.substring(0, role.lastIndexOf(":"));
                const permissions = role.substring(role.lastIndexOf(":") + 1).split(",");

                rolesArray.push(new RoleModel(roleName, permissions));
            });

            this._rolesArray = rolesArray;
        }

        return this._rolesArray;
    }

    /**
     * Returns a role w/ scopes.
     * 
     * @param {String} role 
     * 
     * @return {Promise<RoleModel>}
     */
    async getRole(role) {
        return this._rolesArray.find(roleModel => roleModel.role === role);
    }

    /**
     * Adds a role.
     * 
     * @param {String} role 
     * 
     * @return {Promise<RoleModel>}
     */
    async addRole(role) { throw "Cannot add roles to config"; }

    /**
     *  Removes a role.
     * 
     * @param {String} role 
     * 
     * @return {Promise<Void>}
     */
    async removeRole(role) { throw "Cannot remove roles from config"; }

    /**
     * Adds scope(s) to a specific role.
     * 
     * @param {String} role role to add scope to.
     * @param {Array<String>|String} scopes scope or scopes to add to role.
     * 
     * @return {Promise<RoleModel>}
     */
    async addScopeToRole(role, scopes) { throw "Cannot add scopes to role in config"; }

    /**
     * Removes scope(s) to a specific role.
     * 
     * @param {String} role 
     * @param {Array<String>|String} scopes 
     * 
     * @return {Promise<RoleModel>}
     */
    async removeScopeFromRole(role, scopes) { throw "Cannot remove scopes from role in config"; }

}

module.exports = RoleScopesConfigRepo;