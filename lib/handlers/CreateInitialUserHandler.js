const UserRepo = require("../repos/UserRepo");
const InitialUserRepo = require("../repos/InitialUserRepo");
const UserModel = require("../models/UserModel");
const config = require("../../config");
const PasswordManager = require("../managers/PasswordManager");


class CreateInitialUserHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {InitialUserRepo} initialUserRepo 
     * @param {PasswordManager} passwordManager 
     */
    constructor(userRepo, initialUserRepo, passwordManager) {
        this._userRepo = userRepo;
        this._initialUserRepo = initialUserRepo;
        this._passwordManager = passwordManager;
    }

    async handle() {
        if (!(await this._checkIfInitialUserExists()))
            await this._createInitialUser();

        return {
            status: 200
        };
    }

    /**
     * Checks if user exists in user database
     * if not checks if any record exists in the initial user database.
     * Returns whether any record was found or not.
     * 
     * @return {Promise<Boolean>}
     */
    async _checkIfInitialUserExists() {
        const user = await this._userRepo.getUserByQuery({ email: config.initialUserEmail });

        if (!user)
            return this._initialUserRepo.exists();

        return true;
    }

    /**
     * Creates the actual user of the initial user as well 
     * as a record in the initial user database.
     * 
     * @return {Promise<Void>}
     */
    async _createInitialUser() {
        const user = this._getInitialUser();

        await this._passwordManager.hashPassword(user);
        await this._userRepo.saveUser(user);
        await this._initialUserRepo.saveInitialUser(user);
    }

    /**
     * @return {UserModel}
     */
    _getInitialUser() {
        return new UserModel({
            email: config.initialUserEmail,
            password: config.initialUserPassword,
            firstName: "Admin",
            lastName: "Nimda",
            roles: [config.initialUserRole]
        });
    }

}

module.exports = CreateInitialUserHandler;