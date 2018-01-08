const uuid = require("uuid");
const config = require("../../config");
const utils = require("../utils/utils");
const RoleService = require("../services/RoleService");


class UserModel {

    /**
     * @param {Object} json
     * @param {String=} json.id
     * @param {String} json.email
     * @param {String} json.password
     * @param {String=} json.salt
     * @param {(Date|String|Number)=} json.hashDate
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
     * @param {RoleService} roleService
     */
    toViewModel(roleService) {
        const user = Object.assign({}, this);

        delete user.password;
        delete user.salt;
        delete user.emailVerificationToken;
        delete user.hashDate;

        // @ts-ignore
        delete user._id;

        user.scopes = roleService.getScopesForRoles(user.roles);

        if (config.lowerCaseName) {
            user.firstName = utils.toTitleCase(user.firstName);
            user.lastName = utils.toTitleCase(user.lastName);
            user.middleName = user.middleName ? utils.toTitleCase(user.middleName) : undefined;
        }

        return user;
    }

}

module.exports = UserModel;