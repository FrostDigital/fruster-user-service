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
	 */
	getUsers(query = {}, pagination = { skip: 0, limit: 0 }) {
		try {
			return this._collection
				.find(query, { _id: 0 })
				.skip(pagination.skip)
				.limit(pagination.limit)
				.toArray();
		} catch (err) {
			throw errors.throw("INTERNAL_SERVER_ERROR", err);
		}
	}

	/**
	 * @param {String} userId
	 */
	getById(userId) {
		try {
			return this._collection.findOne({ id: userId }, { fields: { _id: 0 } });
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
	 * @param {String} email 
	 * @param {String=} userId 
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