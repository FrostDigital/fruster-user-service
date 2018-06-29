const UserRepo = require("../repos/UserRepo");
const ProfileRepo = require("../repos/ProfileRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const config = require("../../config");
const EmailUtils = require("../utils/EmailUtils");
const UserModel = require("../models/UserModel");
const ProfileModel = require("../models/ProfileModel");
const log = require("fruster-log");
const Utils = require("../utils/Utils");
const PasswordManager = require("../managers/PasswordManager");
const RoleManager = require("../managers/RoleManager");
const ProfileManager = require("../managers/ProfileManager");
const deprecatedErrors = require("../deprecatedErrors");


class CreateUserHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {PasswordManager} passwordManager
     * @param {RoleManager} roleManager
     * @param {ProfileManager} profileManager
     */
    constructor(userRepo, passwordManager, roleManager, profileManager) {
        this._userRepo = userRepo;
        this._passwordManager = passwordManager;
        this._roleManager = roleManager;
        this._profileManager = profileManager;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        try {
            const data = req.data;
            await this._validateInputData(data);

            /** @type {UserModel} */
            let user;
            /** @type {ProfileModel} */
            let profile;

            // @ts-ignore
            [user, profile] = await this._profileManager.splitUserFields(data);

            user = new UserModel(user);

            await this._passwordManager.hashPassword(user);

            if (Utils.userShouldVerifyEmail(user))
                this._handleEmailVerificationSetup(req.reqId, user);

            const createdUser = await this._userRepo.saveUser(user);

            /** If profile has more keys than its id we need to save the profile, otherwise we don't bother */
            if (Object.keys(profile).length > 1) {
                const createdProfile = await this._profileManager.saveProfile(profile);
                user = createdUser.concatWithProfile(createdProfile);
            }

            return {
                status: 201,
                data: await user.toViewModel(this._roleManager)
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
        user.addEmailVerificationToken(EmailUtils.generateEmailVerificationToken(user));

        if (config.emailVerificationEmailTempate)
            await EmailUtils.sendMailWithTemplate(reqId, user, user.emailVerificationToken, this._roleManager);
        else
            await EmailUtils.sendMail(reqId, user);
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

        if (!Utils.validateEmail(data.email))
            throw deprecatedErrors.invalidEmail(data.email);

        const invalidRoles = await this._roleManager.validateRoles(data.roles);

        if (invalidRoles.length > 0)
            throw deprecatedErrors.invalidRoles(invalidRoles);

        const emailIsUnique = await this._userRepo.validateEmailIsUnique(data.email);

        if (!emailIsUnique)
            throw deprecatedErrors.emailNotUnique(data.email);
    }

}

module.exports = CreateUserHandler;