const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const config = require("../../config");
const emailUtils = require("../utils/email-utils");
const UserModel = require("../models/UserModel");
const log = require("fruster-log");
const utils = require("../utils/utils");
const roleUtils = require("../utils/role-utils");


class CreateUserHandler {

    /**
     * @param {UserRepo} userRepo 
     */
    constructor(userRepo) {
        this._repo = userRepo;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        try {
            const data = req.data;
            await this._validateInputData(data);
            const user = new UserModel(data).hashPassword();

            if (config.requireEmailVerification)
                this._handleEmailVerificationSetup(req.reqId, user);

            const createdUser = await this._repo.saveUser(user);

            return {
                reqId: req.reqId,
                status: 201,
                data: createdUser.toViewModel()
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
    async  _validateInputData(data) {
        if (config.requirePassword && !data.password)
            throw utils.errors.passwordRequired();
        else if (data.password && !this._validatePassword(data.password))
            throw utils.errors.invalidPassword();

        if (!utils.validateEmail(data.email))
            throw utils.errors.invalidEmail(data.email);

        const invalidRoles = roleUtils.validateRoles(data.roles);

        if (invalidRoles.length > 0)
            throw utils.errors.invalidRoles(invalidRoles);

        const emailIsUnique = await this._repo.validateEmailIsUnique(data.email);

        if (!emailIsUnique)
            throw utils.errors.emailNotUnique(data.email);
    }

    _validatePassword(password) {
        return new RegExp(config.passwordValidationRegex).test(password);
    }

}

module.exports = CreateUserHandler;