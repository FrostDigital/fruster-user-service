const ProfileRepo = require("../repos/ProfileRepo");
const UserModel = require("../models/UserModel");
const ProfileModel = require("../models/ProfileModel");
const AccountDataSetModel = require("../models/AccountDataSetModel");
const constants = require("../constants");
const config = require("../../config");


class ProfileManager {

	/**
	 * @param {ProfileRepo} profileRepo
	 */
	constructor(profileRepo) {
		this._profileRepo = profileRepo;
	}

	/**
	 * Saves profile to database.
	 *
	 * @param {ProfileModel} profile
	 *
	 * @return {Promise<ProfileModel>}
	 */
	saveProfile(profile) {
		return this._profileRepo.saveProfile(profile);
	}

	/**
	 * Updates a profile.
	 *
	 * @param {String} id id of the user's whose profile to update
	 * @param {Object} updateData data to set
	 *
	 * @return {Promise<ProfileModel>}
	 */
	updateProfile(id, updateData) {
		return this._profileRepo.updateProfile(id, updateData);
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
	getProfilesByQuery(query, start, limit, filter, sort, caseInsensitiveSort = false) {
		return this._profileRepo.getProfilesByQuery(query, start, limit, filter, sort, caseInsensitiveSort);
	}

	/**
	 * Expands user object with profile data.
	 *
	 * @param {Array<UserModel>} users
	 * @param {Object} filter
	 *
	 * @return {Promise<Array<UserModel>>}
	 */
	async expandUsersWithProfiles(users, filter = {}) {
		const [profiles] = await this.getProfilesByQuery({
			id: { $in: users.map(u => u.id) }
		}, undefined, undefined, filter);

		const profilesById = {};

		profiles.forEach(p => profilesById[p.id] = p);

		return users.map(u => u.concatWithProfile(profilesById[u.id]));
	}

	/**
	 * Expands user object with profile data.
	 *
	 * @param {UserModel} user
	 * @param {Object} filter
	 *
	 * @return {Promise<UserModel>}
	 */
	async expandUserWithProfile(user, filter = {}) {
		const expandedUserArray = await this.expandUsersWithProfiles([user], filter);
		return expandedUserArray[0];
	}

	/**
	 * Splits inputted data in User and Profile according to configuration.
	 *
	 * @param {Object} inputData
	 *
	 * @return {Array<Object>}
	 */
	splitUserFields(inputData) {
		if (config.userFields.includes(constants.dataset.ALL_FIELDS) &&
			config.profileFields.includes(constants.dataset.ALL_FIELDS))
			return [inputData, {}]

		const fields = {
			USER: config.userFields.concat(constants.dataset.USER_REQUIRED_FIELDS),
			PROFILE: config.profileFields
		};

		let user;
		let profile;

		let primarySource = constants.dataset.USER;

		if (config.userFields.includes(constants.dataset.ALL_FIELDS) &&
			!config.profileFields.includes(constants.dataset.ALL_FIELDS))
			/** config.userFields is ALL and config.profileFields has something defined */
			primarySource = constants.dataset.PROFILE;

		const primaryData = addFieldsToObject(inputData, fields[primarySource]);

		const secondaryData = addFieldsToObject(inputData,
			Object.keys(inputData).filter(key => !fields[primarySource].includes(key) &&
				!fields[primarySource].includes(constants.dataset.ALL_FIELDS)));

		switch (primarySource) {
			case constants.dataset.USER:
				user = primaryData
				profile = secondaryData
				break;
			case constants.dataset.PROFILE:
				user = secondaryData
				profile = primaryData
				break;
		}

		return [user, profile];

		function addFieldsToObject(inputData, fields) {
			if (!fields || fields.includes(constants.dataset.ALL_FIELDS))
				return inputData;

			const output = {};

			Object.keys(inputData).filter(k => fields.includes(k)).map(k => output[k] = inputData[k]);

			return output;
		}
	}

}

module.exports = ProfileManager;
