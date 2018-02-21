const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const Utils = require("../utils/Utils");
const config = require("../../config");
const EmailUtils = require("../utils/EmailUtils");
const deprecatedErrors = require("../deprecatedErrors");
const errors = require('../errors');
const PasswordManager = require('../managers/PasswordManager');
const RoleManager = require('../managers/RoleManager');
const UserModel = require('../models/UserModel');
const log = require("fruster-log");


class UpdateUserHandler {

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
        const userId = req.data.id;
        let updateUserData = req.data;

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

        /** If email verification is required, this has to be prepared */
        if (updateUserData.email && (config.requireEmailVerification || config.optionalEmailVerification)) {
            log.debug("config.requireEmailVerification or config.optionalEmailVerification is true, so we need to prepare new email verification data for user", userId);

            const getUser = await this._repo.getById(userId);
            updateUserData = await this._prepareEmailVerification(req.reqId, Object.assign(getUser, updateUserData));
        }

        const responseData = await this._updateInDatabase(userId, updateUserData);
        const returnUser = await new UserModel(responseData).toViewModel(this._roleManager);

        return {
            status: 200,
            data: returnUser
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
        log.debug("Validates email of user", userId);

        if (config.requirePasswordOnEmailUpdate) {
            log.debug("Password is required to inputted when changing email for user", userId);

            /** If  password is required when changing email password has to be in request body */
            if (!updateUserData.password)
                throw errors.get("PASSWORD_REQUIRED");

            /** And it has to be valid. */
            else if (!await this._passwordManager.validatePasswordForUser(updateUserData.password, userId))
                throw errors.get("UNAUTHORIZED");
            else
                log.debug("Password validated correctly for user", userId);
        }

        /** Email has to be valid */
        if (!Utils.validateEmail(updateUserData.email))
            throw deprecatedErrors.invalidEmail(updateUserData.email);

        /** Email has to be unique */
        const emailIsUnique = await this._repo.validateEmailIsUnique(updateUserData.email, userId);

        if (!emailIsUnique)
            throw deprecatedErrors.emailNotUnique(updateUserData.email);

        log.debug("Successfully validated email for user", userId);
    }

    /**
     * Prepares everything that has to happen if `config.requireEmailVerification` is true.
     * 
     * @param {String} reqId 
     * @param {Object} updateUserData 
     */
    async _prepareEmailVerification(reqId, updateUserData) {
        log.debug("Preparing email verification details for user", updateUserData.id);

        const returnData = Object.assign({}, updateUserData);

        returnData.emailVerificationToken = EmailUtils.generateEmailVerificationToken(returnData);
        returnData.emailVerified = false;

        if (config.emailVerificationEmailTempate) {
            log.debug("Should send email verification mail using template to user", updateUserData.id);

            await EmailUtils.sendMailWithTemplate(reqId, new UserModel(returnData),
                returnData.emailVerificationToken, this._roleManager);
        } else {
            log.debug("Should send email verification mail using plain text to user", updateUserData.id);

            await EmailUtils.sendMail(reqId, returnData);
        }

        log.debug("Successfully sent email verification mail to user", updateUserData.id);

        return returnData;
    }

    /**
     * Updates user in database.
     * 
     * @param {String} userId
     * @param {Object} updateUserData 
     */
    async _updateInDatabase(userId, updateUserData) {
        log.debug("Updates user", userId, "in database");

        const updateResponse = await this._repo.updateUser(userId, updateUserData);

        log.debug("Successfully updates user", userId, "in database");

        return updateResponse;
    }

}

module.exports = UpdateUserHandler;