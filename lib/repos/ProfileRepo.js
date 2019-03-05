const Db = require("mongodb").Db;
const constants = require("../constants");
const errors = require("../errors");
const log = require("fruster-log");
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
    async _getProfilesByFindQuery({ query = {}, start = 0, limit = 0, filter = {}, sort = {}, caseInsensitiveSort = false }) {
        try {
            const dbFilter = Object.assign(filter, { _id: 0 });

            const mongoQueryOperation = this._collection
                .find(query, dbFilter)
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
        } catch (err) {
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }
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

        let aggregationQuery = this._collection
            .aggregate(aggregation)
            .skip(start);

        if (hasSort)
            aggregationQuery = aggregationQuery.sort(sortObj);

        if (limit > 0)
            aggregationQuery = aggregationQuery.limit(limit);

        let profilesFromDatabase = await aggregationQuery.toArray();

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

            if (dbCountResult)
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
        try {
            const profilesFromDatabase = await this._collection
                .findOne(query, { fields: { _id: 0 } });

            return profilesFromDatabase ? profilesFromDatabase : null;
        } catch (err) {
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }
    }

	/**
	 * Gets profile by id.
	 * 
	 * @param {String} id
	 * 
	 * @return {Promise<ProfileModel>}
	 */
    async getProfileById(id) {
        try {
            return await this.getProfileByQuery({ id });
        } catch (err) {
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }
    }

	/**
	 * Saves profile to database.
	 * 
	 * @param {ProfileModel} profile 
     * 
     * @return {Promise<ProfileModel>}
	 */
    async saveProfile(profile) {
        try {
            const now = new Date();

            profile.metadata = {};
            profile.metadata.created = now;
            profile.metadata.updated = now;

            const createdProfile = await this._collection.insert(profile);
            return createdProfile.ops[0];
        } catch (err) {
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }
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

        try {
            updatedProfile = await this._collection.update({ id }, updateData);
        } catch (err) {
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", err);
        }

        if (updatedProfile.result.ok === 1)
            return await this.getProfileByQuery({ id });
        else
            throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR");
    }

	/**
	 * Deletes a profile.
	 * 
	 * @param {String} id id of profile to delete
     * 
     * @return {Promise<Boolean>}
	 */
    async deleteProfile(id) {
        try {
            const response = await this._collection.deleteOne({ id });

            if (response.result.n > 0)
                return true;
            else
                return false;
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
	 * Delete profiles
	 * 
	 * @param {Array<String>} ids ids of profiles to delete
     * 
     * @return {Promise<Boolean>}
	 */
    async deleteProfiles(ids) {
        try {
            if (!ids || ids.length === 0)
                return true;

            const response = await this._collection.deleteMany({ id: { $in: ids } });

            if (response.result.n > 0)
                return true;
            else
                return false;
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

module.exports = ProfileRepo;