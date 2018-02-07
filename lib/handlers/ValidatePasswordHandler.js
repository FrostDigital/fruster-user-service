const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserRepo = require("../repos/UserRepo");
const utils = require("../utils/utils");
const config = require("../../config");
const errors = require("../errors");
const deprecatedErrors = require("../deprecatedErrors");
const log = require("fruster-log");
const UserModel = require("../models/UserModel");
const PasswordService = require("../services/PasswordService");
const RoleService = require("../services/RoleService");


class ValidatePasswordHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {PasswordService} passwordService 
     * @param {RoleService} roleService 
     */
    constructor(userRepo, passwordService, roleService) {
        this._repo = userRepo;
        this._usernameValidationDbField = config.usernameValidationDbField;
        this._passwordService = passwordService;
        this._roleService = roleService;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        try {
            const username = req.data.username.toLowerCase().replace(/([.*+?=^!:${}()|[\]\/\\])/g, '\\$1');
            const password = req.data.password;

            const query = {};
            query[this._usernameValidationDbField] = { $regex: new RegExp(["^", username, "$"].join(""), "i") };

            const user = await this._repo.getUserByQuery(query);

            const emailVerificationIsEnabled = config.requireEmailVerification;
            const emailIsNotVerified = user && user.hasOwnProperty("emailVerified") && !user.emailVerified;

            if (emailVerificationIsEnabled && emailIsNotVerified)
                throw errors.throw("EMAIL_NOT_VERIFIED");
            else if (user && (await this._validatePassword(user, password)))
                return {
                    status: 200,
                    data: await user.toViewModel(this._roleService)
                }
            else
                throw deprecatedErrors.invalidUsernameOrPassword();
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
     * @return {Promise<Boolean>}
     */
    async _validatePassword(user, password) {
        if ((await this._passwordService.validatePassword(user.password, user.salt, user.id, password, user.hashDate)))
            return true;
        else
            throw deprecatedErrors.invalidUsernameOrPassword();
    }

}

module.exports = ValidatePasswordHandler;