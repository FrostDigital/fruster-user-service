const Db = require("mongodb").Db;
const constants = require("../constants");
const RoleModel = require("../models/RoleModel");
const AbstractRoleScopesRepo = require("./AbstractRoleScopesRepo");
const errors = require("../errors");


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
     * If nothing exists in database then we get roles from config and add them to the database.
     * 
     * @override
     */
    async prepareRoles() {
        try {
            if ((await this.getRoles()).length === 0) {
                const roles = await super.prepareRoles();
                await this.addRoles(roles);
            }
        } catch (err) {
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }
    }

    /**
     * Returns roles w/ scopes.
     * 
     * @override
     * 
     * @return {Promise<Array<RoleModel>>}
     */
    async getRoles() {
        try {
            return await this._collection.find({}, { fields: { _id: 0 } }).toArray();
        } catch (err) {
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }
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
        try {
            return await this._collection.findOne({ role }, { fields: { _id: 0 } });
        } catch (err) {
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }
    }

    /**
     * Adds a role.
     * 
     * @override
     * 
     * @param {String} role 
     * @param {Array<String>|String} scopes
     * 
     * @return {Promise<RoleModel>}
     */
    async addRole(role, scopes = []) {
        try {
            /** Checks if role exists. If it does, just return and pretend like nothing happened*/
            if ((await this._collection.find({ role }).limit(1).count()) > 0)
                throw errors.get("fruster-user-service.SYSTEM_ROLE_ALREADY_EXISTS", role);

            const scopesToAdd = scopes instanceof Array ? scopes : [scopes];

            await this._collection.insert(new RoleModel(role, scopesToAdd));
            return await this.getRole(role);
        } catch (err) {
            if (err.error)
                throw err;
            else
                throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }
    }

    /**
     * Adds an array of roles.
     * 
     * @override
     * 
     * @param {Array<RoleModel>} roles 
     * 
     * @return {Promise<Void>}
     */
    async addRoles(roles) {
        try {
            await this._collection.insert(roles);
        } catch (err) {
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }
    }

    /**
     *  Removes a role.
     * 
     * @override
     * 
     * @param {String} role 
     * 
     * @return {Promise<Void>}
     */
    async removeRole(role) {
        try {
            await this._collection.remove({ role });
        } catch (err) {
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }
    }

    /**
     * Adds scope(s) to a specific role.
     * 
     * @override
     * 
     * @param {String} role role to add scope to.
     * @param {Array<String>|String} scopes scope or scopes to add to role.
     * 
     * @return {Promise<RoleModel>}
     */
    async addScopesToRole(role, scopes) {
        try {
            const scopesToAdd = scopes instanceof Array ? scopes : [scopes];

            await this._collection.update({ role }, {
                $addToSet: {
                    scopes: { $each: scopesToAdd }
                }
            });
            return await this.getRole(role);
        } catch (err) {
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }
    }

    /**
     * Removes scope(s) to a specific role.
     *
     * @override
     * 
     * @param {String} role 
     * @param {Array<String>|String} scopes 
     * 
     * @return {Promise<RoleModel>}
     */
    async removeScopesFromRole(role, scopes) {
        try {
            const scopesToRemove = scopes instanceof Array ? scopes : [scopes];

            await this._collection.update({ role }, {
                $pull: { scopes: { $in: scopesToRemove } }
            });
            return await this.getRole(role);
        } catch (err) {
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }
    }

}

module.exports = RoleScopesDbRepo;