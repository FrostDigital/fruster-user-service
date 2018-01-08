const UserRepo = require("../repos/UserRepo");
const PasswordService = require("../services/PasswordService");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserModel = require("../models/UserModel");


class SetPasswordHandler {

    /**
     * 
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
        const id = req.data.id;
        const newPassword = req.data.newPassword;

        this._passwordService.validatePasswordFollowsRegExp(newPassword);

        const hashResponse = this._passwordService.hashPasswordForUserId(id, newPassword);

        await this._repo.updateUser(id, {
            password: hashResponse.password,
            salt: hashResponse.salt,
            hashDate: hashResponse.hashDate
        });

        return {
            status: 202
        };
    }

}

module.exports = SetPasswordHandler;