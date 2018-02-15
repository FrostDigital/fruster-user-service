const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const config = require("../../config");
const emailUtils = require("../utils/email-utils");
const UserModel = require("../models/UserModel");
const log = require("fruster-log");
const utils = require("../utils/utils");
const PasswordService = require("../services/PasswordService");
const RoleService = require("../services/RoleService");
const deprecatedErrors = require("../deprecatedErrors");


class CreateUserHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {PasswordService} passwordService
     * @param {RoleService} roleService
     */
    constructor(userRepo, passwordService, roleService) {
        this._repo = userRepo;
        this._passwordService = passwordService;
        this._roleService = roleService;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        try {
            const data = req.data;
            await this._validateInputData(data);
            const user = new UserModel(data);

            await this._passwordService.hashPassword(user);

            if (config.requireEmailVerification ||  config.optionalEmailVerification)
                this._handleEmailVerificationSetup(req.reqId, user);

            const createdUser = await this._repo.saveUser(user);

            return {
                status: 201,
                data: await createdUser.toViewModel(this._roleService)
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
            this._passwordService.validatePasswordFollowsRegExp(data.password);

        if (!utils.validateEmail(data.email))
            throw deprecatedErrors.invalidEmail(data.email);

        const invalidRoles = await this._roleService.validateRoles(data.roles);

        if (invalidRoles.length > 0)
            throw deprecatedErrors.invalidRoles(invalidRoles);

        const emailIsUnique = await this._repo.validateEmailIsUnique(data.email);

        if (!emailIsUnique)
            throw deprecatedErrors.emailNotUnique(data.email);
    }

}

module.exports = CreateUserHandler;