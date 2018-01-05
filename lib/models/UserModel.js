const uuid = require("uuid");
const config = require("../../config");
const utils = require("../utils/utils");
const roleUtils = require("../utils/role-utils");
const passwordUtils = require("../utils/password-utils");

/**
 * @type {User}
 */
class UserModel {

    /**
     * @param {Object} json
     * @param {String} json.id
     * @param {String} json.email
     * @param {String} json.password
     * @param {String} json.firstName
     * @param {String} json.lastName
     * @param {String=} json.middleName
     * @param {Array<String>} json.roles
     * @param {Boolean=} json.emailVerified
     * @param {String=} json.emailVerificationToken
     */
    constructor(json) {
        /** Sets (custom) keys specific to other projects */
        Object.keys(json).forEach(key => {
            this[key] = json[key];
        });

        this.id = json.id || uuid.v4();
        this.email = json.email ? json.email.toLowerCase() : undefined;
        this.password = json.password;

        if (config.lowerCaseName) {
            this.firstName = json.firstName ? json.firstName.toLowerCase() : undefined;
            this.lastName = json.lastName ? json.lastName.toLowerCase() : undefined;
            this.middleName = json.middleName ? json.middleName.toLowerCase() : undefined;
        } else {
            this.firstName = json.firstName;
            this.lastName = json.lastName;
            this.middleName = json.middleName;
        }

        this.roles = [];

        if (json.roles) {
            json.roles.forEach(role => {
                if (!this.roles.includes(role)) {
                    this.roles.push(role);
                }
            });
        }

        this.salt = null;
        this.hashDate = null;
        this.scopes = null;
        this.emailVerified = "emailVerified" in json ? json.emailVerified : true;
        this.emailVerificationToken = "emailVerificationToken" in json ? json.emailVerificationToken : null;
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
     * Hashes password
     * Sets this.password to hashed password, .this.salt to the salt used to hash and this.hashDate to the date it was hashed.
     * 
     * @return {UserModel}
     */
    hashPassword() {
        const hashResponse = passwordUtils.hash(this.id, this.password);

        this.password = hashResponse.hashedPassword;
        this.salt = hashResponse.salt;
        this.hashDate = hashResponse.hashDate;

        return this;
    }

    /**
     * Converts to view model
     */
    toViewModel() {
        const user = Object.assign({}, this);

        delete user.password;
        delete user.salt;
        delete user.emailVerificationToken;
        delete user.hashDate;

        user.scopes = roleUtils.getScopesForRoles(user.roles);

        if (config.lowerCaseName) {
            user.firstName = utils.toTitleCase(user.firstName);
            user.lastName = utils.toTitleCase(user.lastName);
            user.middleName = user.middleName ? utils.toTitleCase(user.middleName) : undefined;
        }

        return user;
    }

}

module.exports = UserModel;