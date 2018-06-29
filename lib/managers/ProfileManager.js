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
     * Expands user object with profile data.
     * 
     * @param {Array<UserModel>} users 
     * @param {Object} filter 
     * 
     * @return {Promise<Array<UserModel>>}
     */
    async expandUsersWithProfiles(users, filter = {}) {
        const [profiles] = await this._profileRepo.getProfilesByQuery({ userId: { $in: users.map(u => u.id) } }, undefined, undefined, filter);
        const profilesByUserId = {};

        profiles.forEach(p => profilesByUserId[p.userId] = p);

        return users.map(u => u.concatWithProfile(profilesByUserId[u.id]));
    }

    /**
     * Expands user object with profile data.
     * 
     * @param {UserModel} user
     * @param {Object} filter 
     * 
     * @return {Promise<>}
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
     * @return {Promise<Array<AccountDataSetModel>>}
     */
    async splitUserFields(inputData) {
        if (config.userFields.includes(constants.dataset.ALL_FIELDS)
            && config.profileFields.includes(constants.dataset.ALL_FIELDS))
            return [inputData, {}]

        const fields = { USER: config.userFields.concat(constants.dataset.USER_REQUIRED_FIELDS), PROFILE: config.profileFields };

        /** @type {UserModel} */
        let user;
        /** @type {ProfileModel} */
        let profile;

        let primarySource = constants.dataset.USER;

        if (config.userFields.includes(constants.dataset.ALL_FIELDS)
            && !config.profileFields.includes(constants.dataset.ALL_FIELDS))
            /** config.userFields is ALL and config.profileFields has something defined */
            primarySource = constants.dataset.PROFILE;

        const primaryData = addFieldsToObject(inputData, fields[primarySource]);
        const secondaryData = addFieldsToObject(inputData,
            Object.keys(inputData).filter(key => !fields[primarySource].includes(key)
                && !fields[primarySource].includes(constants.dataset.ALL_FIELDS)));

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

        user = new UserModel(user);
        profile.userId = user.id;
        profile = new ProfileModel(profile);

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