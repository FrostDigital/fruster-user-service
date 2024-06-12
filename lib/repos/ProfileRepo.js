const Db = require("mongodb").Db;
const constants = require("../constants");
const ProfileModel = require("../models/ProfileModel");


class ProfileRepo {

	/**
	 * @param {Db} db
	 */
	constructor(db) {
		this._collection = db.collection(constants.collections.PROFILES);
	}

	/**
	 * Gets profiles by given query. Can optionally pass in additional
	 * object for pagination.
	 *
	 * @param {Object=} query
	 * @param {Number=} start
	 * @param {Number=} limit
	 * @param {Object=} filter
	 * @param {Object=} sort
	 * @param {Boolean=} caseInsensitiveSort
	 *
	 * @return {Promise<Array<>>}
	 */
	async getProfilesByQuery(query = {}, start = 0, limit = 0, filter = {}, sort = {}, caseInsensitiveSort = false) {
		if (caseInsensitiveSort)
			return this._getProfilesByAggregationQuery({ query, start, limit, filter, sort, caseInsensitiveSort });
		else
			return this._getProfilesByFindQuery({ query, start, limit, filter, sort, caseInsensitiveSort });
	}

	/**
	 * @param {Object} param0
	 * @param {Object=} param0.query
	 * @param {Number=} param0.start
	 * @param {Number=} param0.limit
	 * @param {Object=} param0.filter
	 * @param {Object=} param0.sort
	 * @param {Boolean=} param0.caseInsensitiveSort
	 *
	 * @return {Promise<Array<>>}
	 */
	async _getProfilesByFindQuery({ query = {}, start = 0, limit = 0, filter = {}, sort = {} }) {
		const dbFilter = Object.assign(filter, { _id: 0 });

		const mongoQueryOperation = this._collection
			.find(query)
			.project(dbFilter)
			.skip(start)
			.sort(sort)
			.limit(limit);

		const profilesFromDatabase = await mongoQueryOperation.toArray();

		let totalCount;

		if (limit)
			totalCount = await mongoQueryOperation.count();
		else
			totalCount = profilesFromDatabase.length;

		return [profilesFromDatabase.map(p => new ProfileModel(p, !!filter)), totalCount];
	}

	/**
	 * @param {Object} param0
	 * @param {Object=} param0.query
	 * @param {Number=} param0.start
	 * @param {Number=} param0.limit
	 * @param {Object=} param0.filter
	 * @param {Object=} param0.sort
	 * @param {Boolean=} param0.caseInsensitiveSort
	 *
	 * @return {Promise<Array<>>}
	 */
	async _getProfilesByAggregationQuery({ query = {}, start = 0, limit = 0, filter = {}, sort = {}, caseInsensitiveSort = false }) {
		/** @type {Array} */
		const aggregation = [{ $match: query }];

		const hasSort = Object.keys(sort).length > 0;
		const hasFilter = Object.keys(filter).length > 0;

		let $project;

		if (hasFilter) {
			$project = {};
			/** Converts filter w/ { key: 1 } to { key : "$key" } $project*/
			Object.keys(filter).forEach(filterKey => $project[filterKey] = `$${filterKey}`);
		} else
			/** Sets all document's fields as `profile` */
			$project = { profile: "$$ROOT" };

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

		if (hasSort)
			aggregation.push({ $sort: sortObj });

		aggregation.push({ $skip: start });

		if (limit > 0)
			aggregation.push({ $limit: limit });

		let profilesFromDatabase = await this._collection.aggregate(aggregation).toArray();

		/** If we have a sort we need to readjust results to not have any of the caseinsensitive sorting data */
		if (!hasFilter)
			profilesFromDatabase = profilesFromDatabase.map(p => p.profile);
		else if (caseInsensitiveSort)
			profilesFromDatabase = profilesFromDatabase.map(p => {
				Object.keys(sortObj).forEach(tempSortKey => {
					delete p[tempSortKey.split(".")[0]]; // if using something like "profile.something.firstName" it will be an object in the output
				});

				return p;
			});

		let totalCount;

		if (limit) {
			/** @type {Array<Object>} */
			const countQuery = [{ $match: query }];

			/** @type {Array} */
			const countAggregationQuery = countQuery
				.concat([{ $group: { _id: 1, count: { $sum: 1 } } }]);

			const dbCountResult = await this._collection.aggregate(countAggregationQuery).toArray();

			if (dbCountResult.length)
				totalCount = dbCountResult[0].count;
		}

		return [profilesFromDatabase, totalCount];
	}

	/**
	 * Gets profile by given query.
	 *
	 * @param {Object=} query
	 *
	 * @return {Promise<ProfileModel>}
	 */
	async getProfileByQuery(query = {}) {
		const profilesFromDatabase = await this._collection
			.findOne(query, { _id: 0 });

		return profilesFromDatabase ? profilesFromDatabase : null;
	}

	/**
	 * Saves profile to database.
	 *
	 * @param {ProfileModel} profile
	 *
	 * @return {Promise<ProfileModel>}
	 */
	async saveProfile(profile) {
		const now = new Date();

		profile.metadata = {};
		profile.metadata.created = now;
		profile.metadata.updated = now;

		const createdProfile = await this._collection.insertOne(profile);
		return createdProfile.ops[0];
	}

	/**
	 * Updates a profile.
	 *
	 * @param {String} id id of profile to update
	 * @param {Object} setData data to set
	 * @param {Object=} unsetData data to unset
	 *
	 * @return {Promise<ProfileModel>}
	 */
	async updateProfile(id, setData, unsetData) {
		if (setData.metadata)
			delete setData.metadata;

		setData["metadata.updated"] = new Date();

		const updateData = { $set: setData };

		if (unsetData)
			updateData.$unset = unsetData;

		let updatedProfile;

		updatedProfile = await this._collection.update({ id }, updateData);

		if (updatedProfile.result.ok === 1)
			return await this.getProfileByQuery({ id });
	}

	/**
	 * Deletes a profile.
	 *
	 * @param {String} id id of profile to delete
	 *
	 * @return {Promise<Boolean>}
	 */
	async deleteProfile(id) {
		const { result: { n } } = await this._collection.deleteOne({ id });

		return n > 0;
	}

	/**
	 * Delete profiles
	 *
	 * @param {Array<String>} ids ids of profiles to delete
	 *
	 * @return {Promise<Boolean>}
	 */
	async deleteProfiles(ids) {
		if (!ids || ids.length === 0)
			return true;

		const { result: { n } } = await this._collection.deleteMany({ id: { $in: ids } });

		return n > 0;
	}
}

module.exports = ProfileRepo;
