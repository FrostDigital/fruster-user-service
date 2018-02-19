const uuid = require("uuid");
const config = require("../../config");
const utils = require("../utils/utils");
const RoleManager = require("../managers/RoleManager");
const errors = require("../errors");


class UserModel {

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
        if (!json || typeof json !== "object")
            throw new Error(`Expected json to be of type object but got ${typeof json} with value ${json}`).stack;

        if (isFilteredResult)
            this._fromFilteredData(json);
        else {
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

                if ("middleName" in json)
                    this.middleName = json.middleName ? json.middleName.toLowerCase() : undefined;
            } else {
                this.firstName = json.firstName;
                this.lastName = json.lastName;

                if ("middleName" in json)
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

            if ("salt" in json)
                this.salt = json.salt;

            if ("hashDate" in json)
                //@ts-ignore
                this.hashDate = new Date(json.hashDate);

            if ("scopes" in json)
                this.scopes = null;

            if ("emailVerified" in json)
                this.emailVerified = json.emailVerified;

            if ("emailVerificationToken" in json)
                this.emailVerificationToken = json.emailVerificationToken;
        }
    }

    /**
 * @param {JsonInput} json 
 * 
 * @return {Void}
 */
    _fromFilteredData(json) {
        Object.keys(json)
            .forEach(key => {
                this[key] = json[key];
            });

        if (config.lowerCaseName) {
            if (this.firstName)
                this.firstName = json.firstName ? json.firstName.toLowerCase() : undefined;
            if (this.firstName)
                this.lastName = json.lastName ? json.lastName.toLowerCase() : undefined;

            if (this.middleName)
                this.middleName = json.middleName ? json.middleName.toLowerCase() : undefined;
        }

        if (this.email)
            this.email = json.email ? json.email.toLowerCase() : undefined;

        if (json.salt)
            this.salt = json.salt;

        if (this.hashDate)
            //@ts-ignore
            this.hashDate = new Date(json.hashDate);

        if (this.scopes)
            this.scopes = null;

        if (this.emailVerified)
            this.emailVerified = json.emailVerified;

        if (this.emailVerificationToken)
            this.emailVerificationToken = json.emailVerificationToken;

        if (this.roles && this.roles.length === 0)
            delete this.roles;
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
     * Converts to view model
     * 
     * @param {RoleManager} roleManager
     */
    async toViewModel(roleManager) {
        try {
            const user = Object.assign({}, this);

            delete user.password;
            delete user.salt;
            delete user.emailVerificationToken;
            delete user.hashDate;

            // @ts-ignore
            delete user._id;

            if (user.roles)
                user.scopes = await roleManager.getScopesForRoles(user.roles);

            if (config.lowerCaseName) {
                if (user.firstName)
                    user.firstName = utils.toTitleCase(user.firstName);
                if (user.lastName)
                    user.lastName = utils.toTitleCase(user.lastName);
                if (user.middleName)
                    user.middleName = user.middleName ? utils.toTitleCase(user.middleName) : undefined;
            }

            return user;
        } catch (err) {
            if (err.error)
                throw err;
            else
                throw errors.throw("INTERNAL_SERVER_ERROR", err);
        }
    }

}

module.exports = UserModel;