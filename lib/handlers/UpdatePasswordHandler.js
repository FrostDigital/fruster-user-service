const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserRepo = require("../repos/UserRepo");
const UserModel = require("../models/UserModel");
const PasswordManager = require("../managers/PasswordManager");
const deprecatedErrors = require("../deprecatedErrors");


class UpdatePasswordHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {PasswordManager} passwordManager
     */
    constructor(userRepo, passwordManager) {
        this._repo = userRepo;
        this._passwordManager = passwordManager;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        const userId = req.data.id;
        const oldPassword = req.data.oldPassword;
        const newPassword = req.data.newPassword;

        this._passwordManager.validatePasswordFollowsRegExp(newPassword);

        let user = await this._repo.getById(userId);

        if (!user)
            throw deprecatedErrors.forbidden();

        await this._validatePassword(req.reqId, user, oldPassword);

        user = await this._passwordManager.hashPassword(user, newPassword);

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
     * @param {FrusterRequest} req 
     */
    async handleHttp(req) {
        req.data.id = req.user.id;

        return this.handle(req);
    }

    /**
     * Validates that old password is the actual password of the user updating its password.
     * 
     * @param {String} reqId 
     * @param {UserModel} user 
     * @param {String} oldPassword 
     */
    async _validatePassword(reqId, user, oldPassword) {
        if (!(await this._passwordManager.validatePassword(user.password, user.salt, user.id, oldPassword, user.hashDate)))
            throw deprecatedErrors.invalidUsernameOrPassword();
    }

}

module.exports = UpdatePasswordHandler;