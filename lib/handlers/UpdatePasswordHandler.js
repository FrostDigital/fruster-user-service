const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserRepo = require("../repos/UserRepo");
const ValidatePasswordHandler = require("./ValidatePasswordHandler");
const passwordUtils = require("../utils/password-utils");
const utils = require("../utils/utils");
const config = require("../../config");
const UserModel = require("../models/UserModel");


class UpdatePasswordHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {ValidatePasswordHandler} validatePasswordHandler uses ValidatePasswordHandler to validate and hash new password
     */
    constructor(userRepo, validatePasswordHandler) {
        this._repo = userRepo;
        this._validatePasswordHandler = validatePasswordHandler;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        const userId = req.data.id;
        const oldPassword = req.data.oldPassword;
        const newPassword = req.data.newPassword;

        passwordUtils.validatePasswordFollowsRegExp(newPassword);

        const user = await this._repo.getById(userId);

        if (!user)
            throw utils.errors.forbidden();

        await this._validatePassword(req.reqId, user, oldPassword);

        const hashResponse = passwordUtils.hash(user.id, newPassword);

        await this._repo.updateUser(userId, {
            password: hashResponse.hashedPassword,
            salt: hashResponse.salt,
            hashDate: hashResponse.hashDate
        });

        return utils.accepted();
    }

    /**
     * @param {String} reqId 
     * @param {UserModel} user 
     * @param {String} oldPassword 
     */
    async _validatePassword(reqId, user, oldPassword) {
        try {
            //@ts-ignore
            const validationResponse = await this._validatePasswordHandler.handle({
                reqId: reqId,
                data: {
                    username: user[config.usernameValidationDbField],
                    password: oldPassword
                }
            });

            if (validationResponse.status !== 200) {
                throw utils.errors.forbidden();
            }
        } catch (err) {
            /** Translates 401.3 error to 403.1 🤔 Confusing backwards compatibility */
            throw utils.errors.forbidden();
        }
    }

}

module.exports = UpdatePasswordHandler;