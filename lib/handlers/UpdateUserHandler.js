const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const utils = require("../utils/utils");
const config = require("../../config");
const emailUtils = require("../utils/email-utils");
const deprecatedErrors = require("../deprecatedErrors");


class UpdateUserHandler {

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

        if (updateUserData.password)
            throw deprecatedErrors.cannotUpdatePassword();

        delete updateUserData.password;

        let responseData;

        if (updateUserData.email) {
            if (!utils.validateEmail(updateUserData.email))
                throw deprecatedErrors.invalidEmail(updateUserData.email);

            const emailIsUnique = await this._repo.validateEmailIsUnique(updateUserData.email, userId);

            if (!emailIsUnique)
                throw deprecatedErrors.emailNotUnique(updateUserData.email);
            else {
                if (config.requireEmailVerification || config.optionalEmailVerification) {
                    this._prepareEmailVerification(req.reqId, updateUserData);
                }

                responseData = await this._updateInDatabase(userId, updateUserData);
            }
        } else {
            responseData = await this._updateInDatabase(userId, updateUserData);
        }

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