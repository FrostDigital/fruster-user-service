const UserRepo = require("../repos/UserRepo");
const crypto = require("crypto");
const bus = require("fruster-bus");
const uuid = require("uuid");
const secureRandom = require("csprng");
const config = require("../../config");
const deprecatedErrors = require("../deprecatedErrors");
const UserModel = require("../models/UserModel");


class PasswordService {

    /**
     * @param {UserRepo} userRepo 
     */
    constructor(userRepo) {
        this._userRepo = userRepo;
    }

    /**
     * Hashes password of inputted user 
     * and sets password related variables on the user object. 
     * 
     * @param {UserModel} user 
     * @param {String=} newPassword 
     * 
     * @return {Promise<UserModel>}
     */
    async hashPassword(user, newPassword) {
        const hashDate = new Date();
        const salt = this._generateSalt();
        const pepper = this._generatePepper(user.id, newPassword || user.password, hashDate);
        const hashValue = await this._hashPassword(newPassword || user.password, salt, pepper);

        user.password = hashValue;
        user.salt = salt;
        /** If we want to change hash algorithm in the future 
         *  we have to know when a password was hashed to 
         *  determine what method to use when validating password. **/
        user.hashDate = hashDate;

        return user;
    }

    /**
     * @typedef {Object} HashPasswordForUserIdResponse
     * 
     * @property {String} password
     * @property {String} salt
     * @property {Date} hashDate
     */

    /**
     * Hashes password of inputted userId and password
     * and sets password related variables on the user object. 
     * 
     * @param {String} userId 
     * @param {String=} password 
     * 
     * @return {Promise<HashPasswordForUserIdResponse>}
     */
    async hashPasswordForUserId(userId, password) {
        const hashDate = new Date();
        const salt = this._generateSalt();
        const pepper = this._generatePepper(userId, password, hashDate);
        const hashValue = await this._hashPassword(password, salt, pepper);

        return {
            password: hashValue,
            salt: salt,
            /** If we want to change hash algorithm in the future 
             *  we have to know when a password was hashed to 
             *  determine what method to use when validating password. **/
            hashDate: hashDate
        }
    }

    /**
     * Validates that an inputted password "is the same" as the password for the account,
     * I.e. hashes inputted password and compares its hash to the saved hash in the db. 
     * 
     * @param {String} hashedPassword hashed password from database
     * @param {String} salt salt of user to compare with
     * @param {String} id id of user to compare with
     * @param {String} inputPassword input password to compare with
     * @param {Date} hashDate hashDate of user to compare with
     */
    async validatePassword(hashedPassword, salt, id, inputPassword, hashDate) {
        const pepper = this._generatePepper(id, inputPassword, hashDate);
        const hashValue = await this._hashPassword(inputPassword, salt, pepper);
        return hashValue === hashedPassword;
    }

    /**
     * Validates that a password follows the configured password regex.
     * 
     * @param {String} password 
     */
    validatePasswordFollowsRegExp(password) {
        if (!(new RegExp(config.passwordValidationRegex).test(password)))
            throw deprecatedErrors.invalidPassword();
    }

    /**
     * Generates a salt (Unique key for each user) to be used with hashing.
     */
    _generateSalt() {
        return secureRandom(256, 36);
    }

    /**
     * Generates pepper.
     * 
     * @param {String} id 
     * @param {String} password 
     * @param {Date} hashDate 
     */
    _generatePepper(id, password, hashDate) {
        if (!hashDate || hashDate < new Date("2017-06-26")) {
            return crypto.createHmac("sha256", id + password).digest("hex");
        } else {
            return crypto.createHmac("sha512", id + password).digest("hex");
        }
    }

    /**
     * Hashes password with salt and pepper. 
     * 
     * @param {String} password 
     * @param {String} salt 
     * @param {String} pepper 
     */
    async _hashPassword(password, salt, pepper) {
        const hashedPassword = crypto.createHmac("sha512", password + pepper).digest("hex");
        let hashValue;

        if (config.hashingAlgoritm === "pbkdf2") {
            hashValue = await this._pbkdf2(hashedPassword, salt, pepper);
        } else {
            hashValue = crypto.createHmac(config.hashingAlgoritm, salt + hashedPassword).digest("hex");
        }

        return hashValue;
    }

    /**
     * @param {String} hashedPassword 
     * @param {String} salt 
     * @param {String} pepper 
     */
    _pbkdf2(hashedPassword, salt, pepper) {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(hashedPassword, salt, 1000, 96, "sha512", (err, derivedKey) => {
                if (err)
                    reject(err);
                else
                    resolve(derivedKey.toString("base64"));
            });
        });
    }

}

module.exports = PasswordService;