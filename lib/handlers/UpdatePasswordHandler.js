const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserRepo = require("../repos/UserRepo");
const ValidatePasswordHandler = require("./ValidatePasswordHandler");
const utils = require("../utils/utils");
const config = require("../../config");
const UserModel = require("../models/UserModel");
const PasswordService = require("../services/PasswordService");
const deprecatedErrors = require("../deprecatedErrors");


class UpdatePasswordHandler {

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
        const oldPassword = req.data.oldPassword;
        const newPassword = req.data.newPassword;

        this._passwordService.validatePasswordFollowsRegExp(newPassword);

        let user = await this._repo.getById(userId);

        if (!user)
            throw deprecatedErrors.forbidden();

        await this._validatePassword(req.reqId, user, oldPassword);

        user = this._passwordService.hashPassword(user, newPassword);

        await this._repo.updateUser(userId, {
            password: user.password,
            salt: user.salt,
            hashDate: user.hashDate
        });

        return {
            status: 202
        };
    }

    /**
     * Validates that old password is the actual password of the user updating its password.
     * 
     * @param {String} reqId 
     * @param {UserModel} user 
     * @param {String} oldPassword 
     */
    async _validatePassword(reqId, user, oldPassword) {
        if (!this._passwordService.validatePassword(user.password, user.salt, user.id, oldPassword, user.hashDate))
            throw deprecatedErrors.invalidUsernameOrPassword();
    }

}

module.exports = UpdatePasswordHandler;