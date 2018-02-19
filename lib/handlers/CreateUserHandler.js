const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const config = require("../../config");
const emailUtils = require("../utils/email-utils");
const UserModel = require("../models/UserModel");
const log = require("fruster-log");
const utils = require("../utils/utils");
const PasswordManager = require("../managers/PasswordManager");
const RoleManager = require("../managers/RoleManager");
const deprecatedErrors = require("../deprecatedErrors");


class CreateUserHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {PasswordManager} passwordManager
     * @param {RoleManager} roleManager
     */
    constructor(userRepo, passwordManager, roleManager) {
        this._repo = userRepo;
        this._passwordManager = passwordManager;
        this._roleManager = roleManager;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        try {
            const data = req.data;
            await this._validateInputData(data);
            const user = new UserModel(data);

            await this._passwordManager.hashPassword(user);

            if (config.requireEmailVerification || config.optionalEmailVerification)
                this._handleEmailVerificationSetup(req.reqId, user);

            const createdUser = await this._repo.saveUser(user);

            return {
                status: 201,
                data: await createdUser.toViewModel(this._roleManager)
            };
        } catch (err) {
            log.error(err);
            throw err;
        }
    }

    /**
     * Handles setting up email verification, if configured to do so.
     * 
     * @param {String} reqId 
     * @param {UserModel} user 
     */
    async _handleEmailVerificationSetup(reqId, user) {
        user.addEmailVerificationToken(emailUtils.generateEmailVerificationToken(user));

        if (config.emailVerificationEmailTempate)
            await emailUtils.sendMailWithTemplate(reqId, user, user.emailVerificationToken);
        else
            await emailUtils.sendMail(reqId, user);
    }

    /**
     * Validates request body for dynamic fields
     * 
     * @param {Object} data request body data
     */
    async _validateInputData(data) {
        if (config.requirePassword && !data.password)
            throw deprecatedErrors.passwordRequired();

        if (config.requirePassword)
            this._passwordManager.validatePasswordFollowsRegExp(data.password);

        if (!utils.validateEmail(data.email))
            throw deprecatedErrors.invalidEmail(data.email);

        const invalidRoles = await this._roleManager.validateRoles(data.roles);

        if (invalidRoles.length > 0)
            throw deprecatedErrors.invalidRoles(invalidRoles);

        const emailIsUnique = await this._repo.validateEmailIsUnique(data.email);

        if (!emailIsUnique)
            throw deprecatedErrors.emailNotUnique(data.email);
    }

}

module.exports = CreateUserHandler;