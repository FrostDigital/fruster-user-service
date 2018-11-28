const UserRepo = require("../repos/UserRepo");
const PasswordManager = require("../managers/PasswordManager");
const FrusterRequest = require("fruster-bus").FrusterRequest;


class SetPasswordHandler {

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
        const id = req.data.id;
        const newPassword = req.data.newPassword;

        this._passwordManager.validatePasswordFollowsRegExp(newPassword);

        const hashResponse = await this._passwordManager.hashPasswordForUserId(id, newPassword);

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