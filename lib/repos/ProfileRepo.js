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
	 * 
	 * @return {Promise<Array<>>}
	 */
    async getProfilesByQuery(query = {}, start = 0, limit = 0, filter = {}, sort = {}) {
        const dbFilter = Object.assign(filter, { _id: 0 });

        try {
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

            return [profilesFromDatabase.map(p => new ProfileModel(p)), totalCount];
        } catch (err) {
            throw errors.throw("INTERNAL_SERVER_ERROR", err);
        }
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
            throw errors.throw("INTERNAL_SERVER_ERROR", err);
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
            throw errors.throw("INTERNAL_SERVER_ERROR", err);
        }
    }

	/**
	 * Gets profile by user id.
	 * 
	 * @param {String} userId
	 * 
	 * @return {Promise<ProfileModel>}
	 */
    async getProfileByUserId(userId) {
        try {
            return await this.getProfileByQuery({ userId });
        } catch (err) {
            throw errors.throw("INTERNAL_SERVER_ERROR", err);
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
            const createdProfile = await this._collection.insert(profile);
            return createdProfile.ops[0];
        } catch (err) {
            throw errors.throw("INTERNAL_SERVER_ERROR", err);
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
        const updateData = { $set: setData };

        if (unsetData)
            updateData.$unset = unsetData;

        let updatedProfile;

        try {
            updatedProfile = await this._collection.update({ id }, updateData);
        } catch (err) {
            throw errors.throw("INTERNAL_SERVER_ERROR", err);
        }

        if (updatedProfile.result.ok === 1)
            return await this.getProfileById(id);
        else
            throw errors.throw("INTERNAL_SERVER_ERROR");
    }

	/**
	 * Deletes a user.
	 * 
	 * @param {String} profileId 
	 */
    async deleteProfile(profileId) {
        try {
            const response = await this._collection.deleteOne({ id: profileId });

            if (response.result.n > 0)
                return;
            else
                throw errors.throw("NOT_FOUND", "profile not found");
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

module.exports = ProfileRepo;