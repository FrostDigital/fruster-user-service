const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const utils = require("../utils/utils");
const config = require("../../config");
const emailUtils = require("../utils/email-utils");
const deprecatedErrors = require("../deprecatedErrors");
const errors = require('../errors');
const PasswordService = require('../services/PasswordService');


class UpdateUserHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {PasswordService} passwordService 
     */
    constructor(userRepo, passwordService) {
        this._repo = userRepo;
        this._passwordService = passwordService;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        const userId = req.data.id;
        const updateUserData = req.data;

        if (updateUserData.firstName && config.lowerCaseName)
            updateUserData.firstName = updateUserData.firstName.toLowerCase();

        if (updateUserData.lastName && config.lowerCaseName)
            updateUserData.lastName = updateUserData.lastName.toLowerCase();

        if (updateUserData.middleName && config.lowerCaseName)
            updateUserData.middleName = updateUserData.middleName.toLowerCase();

        if (updateUserData.email)
            updateUserData.email = updateUserData.email.toLowerCase();

        if (updateUserData.password && (!config.requirePasswordOnEmailUpdate && !updateUserData.email))
            throw deprecatedErrors.cannotUpdatePassword();

        /** If request body contains email */
        if (updateUserData.email)
            await this._handleEmailUpdateValidation(req.reqId, userId, updateUserData);

        delete updateUserData.password;

        const responseData = await this._updateInDatabase(userId, updateUserData);

        return {
            status: 200,
            data: responseData
        };
    }

    /**
     * @param {FrusterRequest} req 
     */
    handleHttp(req) {
        req.data = req.data || {};
        req.data.id = req.params.id;

        return this.handle(req);
    }

    /**
     * Validates everything related to updating email.
     * 
     * @param {String} reqId 
     * @param {String} userId
     * @param {Object} updateUserData  
     * 
     * @return {Promise<Void>}
     */
    async  _handleEmailUpdateValidation(reqId, userId, updateUserData) {
        if (config.requirePasswordOnEmailUpdate) {
            /** If  password is required when changing email password has to be in request body */
            if (!updateUserData.password)
                throw errors.get("PASSWORD_REQUIRED");

            /** And it has to be valid. */
            else if (!await this._passwordService.validatePasswordForUser(updateUserData.password, userId))
                throw errors.get("UNAUTHORIZED");
        }

        /** Email has to be valid */
        if (!utils.validateEmail(updateUserData.email))
            throw deprecatedErrors.invalidEmail(updateUserData.email);

        /** Email has to be unique */
        const emailIsUnique = await this._repo.validateEmailIsUnique(updateUserData.email, userId);

        if (!emailIsUnique)
            throw deprecatedErrors.emailNotUnique(updateUserData.email);
        else {
            /** If email verification is required, this has to be prepared*/
            if (config.requireEmailVerification || config.optionalEmailVerification)
                this._prepareEmailVerification(reqId, updateUserData);
        }
    }

    /**
     * Prepares everything that has to happen if `config.requireEmailVerification` is true.
     * 
     * @param {String} reqId 
     * @param {Object} updateUserData 
     */
    async _prepareEmailVerification(reqId, updateUserData) {
        updateUserData.emailVerificationToken = emailUtils.generateEmailVerificationToken(updateUserData);
        updateUserData.emailVerified = false;

        if (config.emailVerificationEmailTempate)
            await emailUtils.sendMailWithTemplate(reqId, updateUserData, updateUserData.emailVerificationToken);
        else
            await emailUtils.sendMail(reqId, updateUserData);
    }

    /**
     * Updates user in database.
     * 
     * @param {String} userId
     * @param {Object} updateUserData 
     */
    async _updateInDatabase(userId, updateUserData) {
        const updateResponse = await this._repo.updateUser(userId, updateUserData);

        return updateResponse;
    }

}

module.exports = UpdateUserHandler;