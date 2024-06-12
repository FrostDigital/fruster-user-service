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
	 * @param {Object} param0
	 *
	 * @param {Object=} param0.query
	 * @param {Number=} param0.start
	 * @param {Number=} param0.limit
	 * @param {Object=} param0.filter
	 * @param {Object=} param0.sort
	 * @param {Boolean=} param0.expand
	 * @param {Boolean=} param0.caseInsensitiveSort
	 * @param {Boolean=} param0.hasExpandSort
	 * @param {Boolean=} param0.count
	 *
	 * @returns {Promise<Array>}
	 */
	async getUsersByQuery({
		query = {}, start = 0, limit = 0, filter = {},
		sort = {}, expand = false, caseInsensitiveSort = false, hasExpandSort = false, count = false
	}) {
		const startTime = Date.now();
		const dbFilter = Object.assign(filter, {});

		let usersFromDatabase;
		let totalCount;

		if (count)
			totalCount = await this._findCount(query);
		else if (expand || caseInsensitiveSort || hasExpandSort)
			[usersFromDatabase, totalCount] = await this._aggregateResult(query, start, limit, dbFilter, sort, expand, caseInsensitiveSort);
		else
			[usersFromDatabase, totalCount] = await this._findResult(query, start, limit, dbFilter, sort);

		if (!usersFromDatabase)
			usersFromDatabase = [];

		if (!totalCount)
			totalCount = usersFromDatabase.length;

		const queryDuration = Date.now() - startTime;

		if (queryDuration >= config.slowQueryThresholdMs)
			log.warn(`SLOW QUERY DETECTED: Duration ${queryDuration}ms, query ${JSON.stringify(query)}, filter ${JSON.stringify(dbFilter)}`)

		return [usersFromDatabase.map(u => new UserModel(u, Object.keys(filter).length > 0)), totalCount];
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
		const aggregation = doExpand &&
			!(config.userFields.includes(constants.dataset.ALL_FIELDS)
				&& config.profileFields.includes(constants.dataset.ALL_FIELDS)
			) ? this._getExpandAggregation(query) : [{ $match: query }];

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
			Object.keys(sort).forEach(sortKey => {
				if (caseInsensitiveSort) {
					$project["__caseInsensitiveSortVar" + sortKey] = { "$toLower": `$${sortKey}` };
					sortObj["__caseInsensitiveSortVar" + sortKey] = sort[sortKey];
				} else {
					$project["__caseSensitiveSortVar" + sortKey] = `$${sortKey}`;
					sortObj["__caseSensitiveSortVar" + sortKey] = sort[sortKey];
				}
			});
		}

		aggregation.push({ $project });

		if (hasSort)
			aggregation.push({ $sort: sortObj });

		aggregation.push({ $skip: start });

		if (limit > 0)
			aggregation.push({ $limit: limit });

		let usersFromDatabase = await this._collection.aggregate(aggregation).toArray();

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

			if (dbCountResult.length)
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
		const mongoQueryOperation = this._collection
			.find(query)
			.project({ ...filter, _id: 0 })
			.sort(sort)
			.collation({ locale: config.locale, numericOrdering: true });


		let usersFromDatabase = await mongoQueryOperation.skip(start).limit(limit).toArray();
		let totalCount;

		if (limit)
			totalCount = await mongoQueryOperation.count();

		return [usersFromDatabase, totalCount]
	}

	/**
	 * If we are just getting users count we can use the normal finds for count.
	 *
	 * @param {Object=} query
	 */
	async _findCount(query) {
		const mongoQueryOperation = this._collection
			.find(query);

		return await mongoQueryOperation.count();
	}

	/**
	 * Gets user by given query.
	 *
	 * @param {Object=} query
	 *
	 * @return {Promise<UserModel>}
	 */
	async getUserByQuery(query = {}) {
		const userFromDatabase = await this._collection.findOne(query, { _id: 0 });

		return userFromDatabase ? new UserModel(userFromDatabase) : null;
	}

	/**
	 * Gets user by given aggregate.
	 *
	 * @param {Array} aggregate
	 *
	 * @return {Promise<Array<UserModel>>}
	 */
	async getUserByAggregate(aggregate) {
		const users = await this._collection.aggregate(aggregate).toArray();
		return users.map(user => new UserModel(user));
	}

	/**
	 * Get records by aggregate
	 *
	 * @param {Array} aggregate
	 *
	 * @return {Promise<Array<any>>}
	 */
	async getByAggregate(aggregate) {
		return await this._collection.aggregate(aggregate).toArray();
	}

	/**
	 * Gets user by given query.
	 *
	 * @param {Object=} query
	 *
	 * @return {Promise<Array<UserModel>>}
	 */
	async getUsersByQueryInternal(query = {}) {
		const usersFromDatabase = await this._collection.find(query).project({ _id: 0 }).toArray();

		return usersFromDatabase.map(u => new UserModel(u));
	}

	/**
	 * Gets user by id.
	 *
	 * @param {String} userId
	 *
	 * @return {Promise<UserModel>}
	 */
	async getById(userId) {
		return await this.getUserByQuery({ id: userId });
	}

	/**
	 * Saves user to database.
	 *
	 * @param {UserModel} user
	 */
	async saveUser(user) {
		const now = new Date();

		user.metadata = {};
		user.metadata.created = now;
		user.metadata.updated = now;

		const createdUser = await this._collection.insertOne(user);

		return new UserModel(createdUser.ops[0]);
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

		await this._collection.update({ id }, updateData);

		return await this.getById(id);
	}

	/**
	 * Adds a set of roles to a user.
	 *
	 * @param {String} id
	 * @param {Array<String>} rolesToAdd
	 */
	async addRolesForUser(id, rolesToAdd) {
		await this._collection.update(
			{ id }, {
			$set: { "metadata.updated": new Date() },
			$push: { roles: { $each: rolesToAdd } }
		});

		return await this.getById(id);
	}

	/**
	 * Removes a set of roles from a user.
	 *
	 * @param {String} id
	 * @param {Array<String>} rolesToRemove
	 */
	async removeRolesForUser(id, rolesToRemove) {
		await this._collection.update(
			{ id }, {
			$set: { "metadata.updated": new Date() },
			$pull: { roles: { $in: rolesToRemove } }
		});

		return await this.getById(id);
	}

	/**
	 * Deletes a user.
	 *
	 * @param {String} userId
	 */
	async deleteUser(userId) {
		const { result: { n } } = await this._collection.deleteOne({ id: userId });

		if (n > 0)
			return;
		else
			throw errors.get("fruster-user-service.NOT_FOUND", "user not found");
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

		await this._collection.deleteMany({ id: { $in: userIds } });
		return userIds;
	}

}

module.exports = UserRepo;
