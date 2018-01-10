const config = require("../../config");
const UserModel = require("../models/UserModel");
const Db = require("mongodb").Db;
const errors = require("../errors");
const log = require("fruster-log");


class UserRepo {

	/**
	 * @param {Db} db 
	 */
	constructor(db) {
		this._collection = db.collection(config.userCollection);
	}

	/**
	 * Gets users by given query. Can optionally pass in additional 
	 * object for pagination.
	 * 
	 * @param {Object=} query 
	 * @param {Number=} start 
	 * @param {Number=} limit 
	 * @param {Object=} filter 
	 * @param {Object=} sort 
	 * 
	 * @return {Promise<Array<>>}
	 */
	async getUsersByQuery(query = {}, start = 0, limit = 0, filter = {}, sort = {}) {
		const dbFilter = Object.assign(filter, { _id: 0 });

		try {
			const mongoQueryOperation = this._collection
				.find(query, dbFilter)
				.skip(start)
				.sort(sort)
				.limit(limit);

			const usersFromDatabase = await mongoQueryOperation.toArray();
			let totalCount;

			if (limit)
				totalCount = await mongoQueryOperation.count();
			else
				totalCount = usersFromDatabase.length;

			// TODO: Uncomment and update other endpoints using this
			return [usersFromDatabase.map(u => new UserModel(u, Object.keys(filter).length > 0)), totalCount];
		} catch (err) {
			throw errors.throw("INTERNAL_SERVER_ERROR", err);
		}
	}

	/**
	 * Gets user by given query. 
	 * 
	 * @param {Object=} query 
	 * 
	 * @return {Promise<UserModel>}
	 */
	async getUserByQuery(query = {}) {
		try {
			const userFromDatabase = await this._collection
				.findOne(query, { fields: { _id: 0 } });

			return userFromDatabase ? new UserModel(userFromDatabase) : null;
		} catch (err) {
			throw errors.throw("INTERNAL_SERVER_ERROR", err);
		}
	}

	/**
	 * Gets user by id.
	 * 
	 * @param {String} userId
	 * 
	 * @return {Promise<UserModel>}
	 */
	async getById(userId) {
		try {
			return await this.getUserByQuery({ id: userId });
		} catch (err) {
			throw errors.throw("INTERNAL_SERVER_ERROR", err);
		}
	}

	/**
	 * Saves user to database.
	 * 
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
	 * Updates a user.
	 * 
	 * @param {String} id id of user to update
	 * @param {Object} setData data to set 
	 * @param {Object=} unsetData data to unset
	 */
	async updateUser(id, setData, unsetData) {
		const updateData = { $set: setData };

		if (unsetData)
			updateData.$unset = unsetData;

		let updatedUser;

		try {
			updatedUser = await this._collection.update({ id }, updateData);
		} catch (err) {
			throw errors.throw("INTERNAL_SERVER_ERROR", err);
		}

		if (updatedUser.result.ok === 1)
			return await this.getById(id);
		else
			throw errors.throw("INTERNAL_SERVER_ERROR");
	}

	/**
	 * Adds a set of roles to a user.
	 * 
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
	 * Removes a set of roles from a user.
	 * 
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
	 * Validates if a user with provided email already exists.
	 * 
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

	/**
	 * Deletes a user.
	 * 
	 * @param {String} userId 
	 */
	async deleteUser(userId) {
		try {
			const response = await this._collection.deleteOne({ id: userId });

			if (response.result.n > 0) {
				return;
			} else {
				throw errors.throw("NOT_FOUND", "user not found");
			}
		} catch (err) {
			if (err.error)
				throw err;
			else {
				log.error(err);
				throw errors.throw("INTERNAL_SERVER_ERROR", err);
			}
		}
	}

}

module.exports = UserRepo;