const AccountDataSetModel = require("./AccountDataSetModel");
const ProfileModel = require("./ProfileModel");
const constants = require("../constants");


class UserModel extends AccountDataSetModel {

    /**
     * @typedef {Object} JsonInput
     * 
     * @property {String=} id
     * @property {String} email
     * @property {String} password
     * @property {String=} salt
     * @property {(Date|String|Number)=} hashDate
     * @property {String} firstName
     * @property {String} lastName
     * @property {String=} middleName
     * @property {Array<String>} roles
     * @property {Boolean=} emailVerified
     * @property {String=} emailVerificationToken
     */

    /**
     * @param {JsonInput} json
     * @param {Boolean=} isFilteredResult whether or not json is filtered result.
     */
    constructor(json, isFilteredResult) {
        super(json, isFilteredResult);
    }

    /**
     * Adds email verification and sets variables associated to the correct values.
     * 
     * @param {String} emailVerificationToken 
     * 
     * @return {UserModel}
     */
    addEmailVerificationToken(emailVerificationToken) {
        this.emailVerificationToken = emailVerificationToken;
        this.emailVerified = false;

        return this;
    }

    /**
     * Concats a ProfileModel with the UserModel
     * 
     * @param {ProfileModel} profile the profile to concat with
     * 
     * @return {UserModel}
     */
    concatWithProfile(profile) {
        const copyOfThis = Object.assign({}, this);

        // @ts-ignore
        if (!copyOfThis.profiles)
            // @ts-ignore
            copyOfThis.profiles = [profile];
        else
            // @ts-ignore
            copyOfThis.profiles.push(profile)

        return new UserModel(copyOfThis, false);
    }

    /**
     * Concats an array of ProfileModels with the UserModel
     * 
     * @param {Array<ProfileModel>} profiles the profile to concat with
     * 
     * @return {UserModel}
     */
    concatWithProfiles(profiles) {
        const copyOfThis = Object.assign({}, this);

        // @ts-ignore
        if (!copyOfThis.profiles)
            // @ts-ignore
            copyOfThis.profiles = profiles;
        else
            // @ts-ignore
            copyOfThis.profiles.concat(profiles);

        return new UserModel(copyOfThis, false);
    }

}

module.exports = UserModel;