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
		if ((await this.getRoles()).length === 0) {
			const roles = await super.prepareRoles();
			await this.addRoles(roles);
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
		return await this._collection.find({}, { fields: { _id: 0 } }).toArray();
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
		return await this._collection.findOne({ role }, { fields: { _id: 0 } });
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
		/** Checks if role exists. If it does, just return and pretend like nothing happened*/
		if ((await this._collection.find({ role }).limit(1).count()) > 0)
			throw errors.get("fruster-user-service.SYSTEM_ROLE_ALREADY_EXISTS", role);

		const scopesToAdd = scopes instanceof Array ? scopes : [scopes];

		await this._collection.insert(new RoleModel(role, scopesToAdd));
		return await this.getRole(role);
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
		await this._collection.insert(roles);
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
		await this._collection.remove({ role });
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
		const scopesToAdd = scopes instanceof Array ? scopes : [scopes];

		await this._collection.update({ role }, {
			$addToSet: {
				scopes: { $each: scopesToAdd }
			}
		});

		return await this.getRole(role);
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
		const scopesToRemove = scopes instanceof Array ? scopes : [scopes];

		await this._collection.update({ role }, {
			$pull: { scopes: { $in: scopesToRemove } }
		});

		return await this.getRole(role);
	}

}

module.exports = RoleScopesDbRepo;
