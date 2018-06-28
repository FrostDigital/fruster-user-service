const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const config = require("../../config");
const EmailUtils = require("../utils/EmailUtils");
const UserModel = require("../models/UserModel");
const ProfileModel = require("../models/ProfileModel");
const log = require("fruster-log");
const Utils = require("../utils/Utils");
const PasswordManager = require("../managers/PasswordManager");
const RoleManager = require("../managers/RoleManager");
const deprecatedErrors = require("../deprecatedErrors");
const constants = require("../constants");
const uuid = require("uuid");

class CreateUserHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {PasswordManager} passwordManager
     * @param {RoleManager} roleManager
     */
    constructor(userRepo, profileRepo, passwordManager, roleManager) {
        this._userRepo = userRepo;
        this._profileRepo = profileRepo;
        this._passwordManager = passwordManager;
        this._roleManager = roleManager;

        this._fields = {
            // USER: config.userFields,
            USER: config.userFields.concat(constants.dataset.USER_REQUIRED_FIELDS), // TODO: Make sure this concat doesn't prevent the ALL behaviour
            PROFILE: config.profileFields
        };

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
            [user, profile] = await this._splitUser(data);

            user = new UserModel(user);
            profile = new ProfileModel(profile);

            await this._passwordManager.hashPassword(user);

            if (Utils.userShouldVerifyEmail(user))
                this._handleEmailVerificationSetup(req.reqId, user);

            const createdUser = await this._userRepo.saveUser(user);

            /** If profile has more keys than its id we need to save the profile, otherwise we don't bother */
            if (Object.keys(profile).length > 1) {
                const createdProfile = await this._userRepo.saveUser(user);
                user = createdUser.concatWithProfile(profile);
                // TODO: Save profile.
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
     * Splits inputted data in User and Profile according to configuration.
     * 
     * @param {Object} inputData 
     */
    async _splitUser(inputData) {
        let user = {};
        let profile = {};
        let primarySource = constants.dataset.USER;

        if (config.userFields.includes(constants.dataset.ALL_FIELDS)
            && !config.profileFields.includes(constants.dataset.ALL_FIELDS))
            /** User fields is ALL and Profile fields has something defined */
            primarySource = constants.dataset.PROFILE;

        const primaryData = addFieldsToObject(inputData, this._fields[primarySource]);
        const secondaryData = addFieldsToObject(inputData,
            Object.keys(inputData).filter(key => !this._fields[primarySource].includes(key)
                && !this._fields[primarySource].includes(constants.dataset.ALL_FIELDS)));

        switch (primarySource) {
            case constants.dataset.USER:
                user = primaryData
                profile = secondaryData
                break;
            case constants.dataset.PROFILE:
                user = secondaryData
                profile = primaryData
                break;
        }

        return [user, profile];

        function addFieldsToObject(inputData, fields) {
            if (!fields || fields.includes(constants.dataset.ALL_FIELDS))
                return inputData;

            const output = {};

            Object.keys(inputData).filter(k => fields.includes(k)).map(k => output[k] = inputData[k]);

            return output;
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