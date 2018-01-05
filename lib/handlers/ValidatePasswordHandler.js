const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserRepo = require("../repos/UserRepo");
const utils = require("../utils/utils");
const config = require("../../config");
const passwordUtils = require("../utils/password-utils");
const errors = require("../errors");
const log = require("fruster-log");
const UserModel = require("../models/UserModel");


class ValidatePasswordHandler {

    /**
     * @param {UserRepo} userRepo 
     */
    constructor(userRepo) {
        this._repo = userRepo;
        this._usernameValidationDbField = config.usernameValidationDbField;
    }
    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        try {
            const username = req.data.username.toLowerCase();
            const password = req.data.password;

            const query = {};
            query[this._usernameValidationDbField] = { $regex: new RegExp(`^${username}`, "i") };

            const user = (await this._repo.getUsersByQuery(query))[0];

            const emailVerificationIsEnabled = config.requireEmailVerification;
            const emailIsNotVerified = user && user.hasOwnProperty("emailVerified") && !user.emailVerified;

            if (emailVerificationIsEnabled && emailIsNotVerified)
                throw errors.throw("EMAIL_NOT_VERIFIED");
            else if (user)
                return this._validatePassword(user, password);
            else
                throw utils.unauthorized(4);
        } catch (err) {
            log.error(err);
            throw err;
        }
    }

    /**
     * Validates that the password is the password of the user found in database.
     * Returns user if validation is sucessful.
     * 
     * @param {UserModel} user 
     * @param {String} password 
     * 
     * @return {Object}
     */
    _validatePassword(user, password) {
        if (passwordUtils.validatePassword(user.password, user.salt, user.id, password, user.hashDate))
            return {
                status: 200,
                data: user.toViewModel()
            }
        else
            throw utils.unauthorized(3);
    }

}

module.exports = ValidatePasswordHandler;