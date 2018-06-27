const AccountDataModel = require("./AccountDataModel");


class UserModel extends AccountDataModel {

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

}

module.exports = UserModel;