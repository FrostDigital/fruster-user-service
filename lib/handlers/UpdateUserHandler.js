const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const utils = require("../utils/utils");
const config = require("../../config");
const emailUtils = require("../utils/email-utils");


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
            throw utils.badRequest("Cannot update password", "Cannot update password through user update", 6);

        delete updateUserData.password;

        let responseData;

        if (updateUserData.email) {
            if (!utils.validateEmail(updateUserData.email))
                throw utils.errors.invalidEmail(updateUserData.email);

            const emailIsUnique = await this._repo.validateEmailIsUnique(updateUserData.email, userId);

            if (!emailIsUnique)
                throw utils.errors.emailNotUnique(updateUserData.email);
            else {
                if (config.requireEmailVerification) {
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

    async _prepareEmailVerification(reqId, updateUserData) {
        updateUserData.emailVerificationToken = emailUtils.generateEmailVerificationToken(updateUserData);
        updateUserData.emailVerified = false;

        if (config.emailVerificationEmailTempate)
            await emailUtils.sendMailWithTemplate(reqId, updateUserData, updateUserData.emailVerificationToken);
        else
            await emailUtils.sendMail(reqId, updateUserData);
    }

    async _updateInDatabase(userId, updateUserData) {
        const updateResponse = await this._repo.updateUser(userId, updateUserData);

        return updateResponse;
    }

}

module.exports = UpdateUserHandler;