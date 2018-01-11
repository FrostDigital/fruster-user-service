const Db = require("mongodb").Db;
const constants = require("../constants");
const RoleModel = require("../models/RoleModel");
const AbstractRoleScopesRepo = require("./AbstractRoleScopesRepo");


/**
 * RoleScopesRepo getting its data from the db.
 */
class RoleScopesDbRepo extends AbstractRoleScopesRepo {

    /**
     * @param {Db} db 
     */
    constructor(db) {
        super();
        this._collection = db.collection(constants.collections.ROLE_SCOPES);
    }

    /**
     * Returns roles w/ scopes.
     * 
     * @return {Promise<Array<RoleModel>}
     */
    async getRoles() {
        return await this._collection.find({}, { _id: 0 }).toArray();
    }

    /**
     * Returns a role w/ scopes.
     * 
     * @param {String} role 
     * 
     * @return {Promise<RoleModel>}
     */
    async getRole(role) {
        return await this._collection.findOne({ role }, { fields: { _id: 0 } });
    }

    /**
     * Adds a role.
     * 
     * @param {String} role 
     * 
     * @return {Promise<RoleModel>}
     */
    async addRole(role) {
        await this._collection.insert(new RoleModel(role, []));
        return await this.getRole(role);
    }

    /**
     *  Removes a role.
     * 
     * @param {String} role 
     * 
     * @return {Promise<Void>}
     */
    async removeRole(role) {
        await this._collection.remove({ role });
    }

    /**
     * Adds scope(s) to a specific role.
     * 
     * @param {String} role role to add scope to.
     * @param {Array<String>|String} scopes scope or scopes to add to role.
     * 
     * @return {Promise<RoleModel>}
     */
    async addScopeToRole(role, scopes) {
        const scopesToAdd = scopes instanceof Array ? scopes : [scopes];

        await this._collection.update({ role }, { $addToSet: { scopes: { $each: scopesToAdd } } });
        return await this.getRole(role);
    }

    /**
     * Removes scope(s) to a specific role.
     * 
     * @param {String} role 
     * @param {Array<String>|String} scopes 
     * 
     * @return {Promise<RoleModel>}
     */
    async removeScopeFromRole(role, scopes) {
        const scopesToAdd = scopes instanceof Array ? scopes : [scopes];

        await this._collection.update({ role }, { $pull: { roles: { $in: scopesToAdd } } });
        return await this.getRole(role);
    }

}

module.exports = RoleScopesDbRepo;