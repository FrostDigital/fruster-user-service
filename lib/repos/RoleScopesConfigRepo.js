const AbstractRoleScopesRepo = require("./AbstractRoleScopesRepo");
const RoleModel = require("../models/RoleModel");
const uuid = require("uuid");

/**
 * RoleScopesRepo getting its data from the config.
 */
class RoleScopesConfigRepo extends AbstractRoleScopesRepo {

    constructor() {
        super();
        /** @type {Array<RoleModel>} */
        this._rolesArray = [];
        this.id = uuid.v4();
    }

    /**
     * Reads roles from config and stores them in memory.
     * 
     * @override
     */
    async prepareRoles() {
        if (this._rolesArray.length === 0) {
            const rolesArray = await super.prepareRoles();
            this._rolesArray = rolesArray;
        }
    }

    /**
     * Returns roles w/ scopes.
     * 
     * @override
     * 
     * @return {Promise<Array<RoleModel>}
     */
    async getRoles() {
        return this._rolesArray;
    }

    /**
     * Returns a role w/ scopes.
     * 
     * @override
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
     * @override
     * 
     * @return {Promise<RoleModel>}
     */
    async addRole() { throw "Cannot add roles to config"; }

    /**
     *  Removes a role.
     * 
     * @override
     * 
     * @return {Promise<Void>}
     */
    async removeRole() { throw "Cannot remove roles from config"; }

    /**
     * Adds scope(s) to a specific role.
     * 
     * @override
     * 
     * @return {Promise<RoleModel>}
     */
    async addScopesToRole() { throw "Cannot add scopes to role in config"; }

    /**
     * Removes scope(s) to a specific role.
     * 
     * @override
     * 
     * @return {Promise<RoleModel>}
     */
    async removeScopesFromRole() { throw "Cannot remove scopes from role in config"; }

}

module.exports = RoleScopesConfigRepo;