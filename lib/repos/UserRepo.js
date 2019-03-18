const UserModel = require("../models/UserModel");
const Db = require("mongodb").Db;
const errors = require("../errors");
const log = require("fruster-log");
const constants = require("../constants");
const config = require("../../config");

class UserRepo {

	/**
	 * @param {Db} db
	 */
	constructor(db) {
		this._collection = db.collection(constants.collections.USERS);
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
	 * @param {Boolean=} expand
	 *
	 * @return {Promise<Array<>>}
	 */
	async getUsersByQuery(query = {}, start = 0, limit = 0, filter = {}, sort = {}, expand = false, caseInsensitiveSort = false) {
		const startTime = Date.now();
		const dbFilter = Object.assign(filter, {});

		try {
			let usersFromDatabase;
			let totalCount;

			if (expand || caseInsensitiveSort)
				[usersFromDatabase, totalCount] = await this._aggregateResult(query, start, limit, dbFilter, sort, expand, caseInsensitiveSort);
			else
				[usersFromDatabase, totalCount] = await this._findResult(query, start, limit, dbFilter, sort);

			if (!totalCount)
				totalCount = usersFromDatabase.length;

			const queryDuration = Date.now() - startTime;

			if (queryDuration >= config.slowQueryTresholdMs)
				log.warn(`SLOW QUERY DETECTED: Duration ${queryDuration}ms, query ${JSON.stringify(query)}, filter ${JSON.stringify(dbFilter)}`)

			return [usersFromDatabase.map(u => new UserModel(u, Object.keys(filter).length > 0)), totalCount];
		} catch (err) {
			log.error(err);
			throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
		}
	}

	/**
	 * if we want to expand user with profile we need to aggregate results together.
	 *
	 * @param {Object=} query
	 * @param {Number=} start
	 * @param {Number=} limit
	 * @param {Object=} filter
	 * @param {Object=} sort
	 */
	async _aggregateResult(query, start = 0, limit = 0, filter, sort, doExpand, caseInsensitiveSort) {
		/** @type {Array} */
		const aggregation = doExpand ? this._getExpandAggregation(query) : [{ $match: query }];

		const hasSort = Object.keys(sort).length > 0;
		const hasFilter = Object.keys(filter).length > 0;

		let $project;

		if (hasFilter) {
			$project = {};
			/** Converts filter w/ { key: 1 } to { key : "$key" } $project*/
			Object.keys(filter).forEach(filterKey => $project[filterKey] = `$${filterKey}`);
		} else
			/** Sets all document's fields as `user` */
			$project = { user: "$$ROOT" };

		let sortObj = {};

		if (hasSort) {
			/**
			 * Goes through all inputted keys to sort on and projects a lowercased version of that key's value.
			 * Then we sort on that lowercased value in the order that was inputted.
			 */
			if (caseInsensitiveSort) {
				Object.keys(sort).forEach(sortKey => {
					$project["__caseInsensitiveSortVar" + sortKey] = { "$toLower": `$${sortKey}` };
					sortObj["__caseInsensitiveSortVar" + sortKey] = sort[sortKey];
				});
			} else
				sortObj = sort;
		}

		aggregation.push({ $project });

		let aggregationQuery = this._collection
			.aggregate(aggregation)
			.skip(start);

		if (hasSort)
			aggregationQuery = aggregationQuery.sort(sortObj);

		if (limit > 0)
			aggregationQuery = aggregationQuery.limit(limit);

		let usersFromDatabase = await aggregationQuery.toArray();

		/** If we have a sort we need to readjust results to not have any of the caseinsensitive sorting data */
		if (!hasFilter)
			usersFromDatabase = usersFromDatabase.map(u => u.user);
		else if (caseInsensitiveSort)
			usersFromDatabase = usersFromDatabase.map(u => {
				Object.keys(sortObj).forEach(tempSortKey => {
					delete u[tempSortKey.split(".")[0]]; // if using something like "user.something.firstName" it will be an object in the output
				});

				return u;
			});

		let totalCount;

		if (limit) {
			const countQuery = doExpand ? this._getExpandAggregation(query) : [{ $match: query }];

			/** @type {Array} */
			const countAggregationQuery = countQuery
				.concat([{ $group: { _id: 1, count: { $sum: 1 } } }]);

			const dbCountResult = await this._collection.aggregate(countAggregationQuery).toArray();

			if (dbCountResult)
				totalCount = dbCountResult[0].count;
		}

		return [usersFromDatabase, totalCount];
	}

	/**
	 * Returns an aggregation cursor for combining user and profiles into one, querying on both.
	 *
	 * @param {Object} query
	 *
	 * @return {Array}
	 */
	_getExpandAggregation(query) {
		return [
			{ $lookup: { from: "profiles", localField: "id", foreignField: "id", as: "profile" } },
			{ $match: query },
			{ $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } }
		];
	}

	/**
	 * If we are just getting users we can sue the normal finds.
	 *
	 * @param {Object=} query
	 * @param {Number=} start
	 * @param {Number=} limit
	 * @param {Object=} filter
	 * @param {Object=} sort
	 */
	async _findResult(query, start = 0, limit = 0, filter, sort) {
		const dbFilter = Object.assign(filter, { _id: 0 });
		const mongoQueryOperation = this._collection
			.find(query, dbFilter)
			.sort(sort);

		let usersFromDatabase = await mongoQueryOperation.skip(start).limit(limit).toArray();
		let totalCount;

		if (limit)
			totalCount = await mongoQueryOperation.count();

		return [usersFromDatabase, totalCount]
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
			const userFromDatabase = await this._collection.findOne(query, { fields: { _id: 0 } });

			return userFromDatabase ? new UserModel(userFromDatabase) : null;
		} catch (err) {
			throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
		}
	}

	/**
	 * Gets user by given query.
	 *
	 * @param {Object=} query
	 *
	 * @return {Promise<Array<UserModel>>}
	 */
	async getUsersByQueryInternal(query = {}) {
		try {
			const usersFromDatabase = await this._collection.find(query, { fields: { _id: 0 } }).toArray();

			return usersFromDatabase.map(u => new UserModel(u));
		} catch (err) {
			throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
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
			throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
		}
	}

	/**
	 * Saves user to database.
	 *
	 * @param {UserModel} user
	 */
	async saveUser(user) {
		try {
			const now = new Date();

			user.metadata = {};
			user.metadata.created = now;
			user.metadata.updated = now;

			const createdUser = await this._collection.insert(user);

			return new UserModel(createdUser.ops[0]);
		} catch (err) {
			if (err.code && err.code === constants.MONGO_DB_DUPLICATE_KEY_ERROR_CODE)
				throw err;
			else
				throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
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
		if (setData.metadata)
			delete setData.metadata;

		setData["metadata.updated"] = new Date();

		const updateData = { $set: setData };

		if (unsetData)
			updateData.$unset = unsetData;

		let updatedUser;

		try {
			updatedUser = await this._collection.update({ id }, updateData);
		} catch (err) {
			if (err.code && err.code === constants.MONGO_DB_DUPLICATE_KEY_ERROR_CODE)
				throw err;
			else
				throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
		}

		if (updatedUser.result.ok === 1)
			return await this.getById(id);
		else
			throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR");
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
			updatedUser = await this._collection.update(
				{
					id
				}, {
					$set: { "metadata.updated": new Date() },
					$push: { roles: { $each: rolesToAdd } }
				});
		} catch (err) {
			throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
		}

		if (updatedUser.result.ok === 1)
			return this.getById(id);
		else
			throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR");
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
			updatedUser = await this._collection.update(
				{
					id
				}, {
					$set: { "metadata.updated": new Date() },
					$pull: { roles: { $in: rolesToRemove } }
				});
		} catch (err) {
			throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
		}

		if (updatedUser.result.ok === 1)
			return this.getById(id);
		else
			throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR");
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
				if (userId) return result.id === userId;
				else return false;
			} else return true;
		} catch (err) {
			throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
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

			if (response.result.n > 0)
				return;
			else
				throw errors.get("fruster-user-service.NOT_FOUND", "user not found");
		} catch (err) {
			if (err.error)
				throw err;
			else {
				log.error(err);
				throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
			}
		}
	}

	/**
	 * Deletes any users found with query
	 *
	 * @param {Object} query'
	 *
	 * @return {Promise<Array<String>>}
	 */
	async deleteUsersByQuery(query) {
		const usersToDelete = await this._collection.aggregate(this._getExpandAggregation(query)).toArray();
		const userIds = usersToDelete.map(u => u.id);

		try {
			await this._collection.deleteMany({ id: { $in: userIds } });
			return userIds;
		} catch (err) {
			if (err.error)
				throw err;
			else {
				log.error(err);
				throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
			}
		}
	}

}

module.exports = UserRepo;
