const config = require("../../config");
const UserModel = require("../models/UserModel");
const Db = require("mongodb").Db;
const errors = require("../errors");


class UserRepo {

	/**
	 * @param {Db} db 
	 */
	constructor(db) {
		this._collection = db.collection(config.userCollection);
	}

	/**
	 * Get users by given query. Can optionally pass in additional 
	 * object for pagination.
	 * 
	 * @param {Object=} query 
	 * @param {Object=} pagination 
	 * 
	 * @return {Promise<Array<UserModel>>}
	 */
	async getUsersByQuery(query = {}, pagination = { skip: 0, limit: 0 }) {
		try {
			const usersFromDatabase = await this._collection
				.find(query, { _id: 0 })
				.skip(pagination.skip)
				.limit(pagination.limit)
				.toArray();

			return usersFromDatabase.map(u => new UserModel(u));
		} catch (err) {
			throw errors.throw("INTERNAL_SERVER_ERROR", err);
		}
	}

	/**
	 * @param {String} userId
	 * 
	 * @return {Promise<UserModel>}
	 */
	async getById(userId) {
		try {
			const databaseResult = await this._collection.findOne({ id: userId }, { fields: { _id: 0 } });
			return databaseResult ? new UserModel(databaseResult) : null;
		} catch (err) {
			throw errors.throw("INTERNAL_SERVER_ERROR", err);
		}
	}

	/**
	 * @param {UserModel} user 
	 */
	async saveUser(user) {
		try {
			const createdUser = await this._collection.insert(user);
			return new UserModel(createdUser.ops[0]);
		} catch (err) {
			throw errors.throw("INTERNAL_SERVER_ERROR", err);
		}
	}

	/**
	 * @param {String} id
	 * @param {Object} updateData
	 */
	async updateUser(id, updateData) {
		let updatedUser;

		try {
			updatedUser = await this._collection.update({ id }, { $set: updateData });
		} catch (err) {
			throw errors.throw("INTERNAL_SERVER_ERROR", err);
		}

		if (updatedUser.result.ok === 1)
			return this.getById(id);
		else
			throw errors.throw("INTERNAL_SERVER_ERROR");
	}

	/**
	 * @param {String} id
	 * @param {Array<String>} rolesToAdd
	 */
	async addRolesForUser(id, rolesToAdd) {
		let updatedUser;

		try {
			updatedUser = await this._collection.update({ id }, {
				$push: { roles: { $each: rolesToAdd } }
			});
		} catch (err) {
			throw errors.throw("INTERNAL_SERVER_ERROR", err);
		}

		if (updatedUser.result.ok === 1)
			return this.getById(id);
		else
			throw errors.throw("INTERNAL_SERVER_ERROR");
	}

	/**
	 * @param {String} id
	 * @param {Array<String>} rolesToRemove
	 */
	async removeRolesForUser(id, rolesToRemove) {
		let updatedUser;

		try {
			updatedUser = await this._collection.update({ id }, {
				$pull: { roles: { $in: rolesToRemove } }
			});
		} catch (err) {
			throw errors.throw("INTERNAL_SERVER_ERROR", err);
		}

		if (updatedUser.result.ok === 1)
			return this.getById(id);
		else
			throw errors.throw("INTERNAL_SERVER_ERROR");
	}

	/**
	 * @param {String} email 
	 * @param {String=} userId 
	 * 
	 * @return {Promise<Boolean>}
	 */
	async validateEmailIsUnique(email, userId) {
		try {
			const result = await this._collection.findOne({ email });

			if (!!result) {
				/** If email exists, make sure it doesn't belong to the user checking */
				if (userId)
					return result.id === userId;
				else
					return false;
			} else {
				return true;
			}
		} catch (err) {
			throw errors.throw("INTERNAL_SERVER_ERROR", err);
		}
	}

}

module.exports = UserRepo;