const uuid = require("uuid");
const MailServiceClient = require("../clients/MailServiceClient");
const conf = require("../../config.js");
const crypto = require("crypto");
const secureRandom = require("csprng");
const UserModel = require("../models/UserModel");
const RoleManager = require('../managers/RoleManager');


class EmailUtils {

    /**
     * @param {String} reqId 
     * @param {UserModel} user 
     * @param {String} token 
     * @param {RoleManager=} roleManager 
     * 
     * @return {Promise}
     */
    static async sendMailWithTemplate(reqId, user, token, roleManager) {
        const userTemplateArgs = await user.toViewModel(roleManager);
        const templateArgs = { user: userTemplateArgs, token };

        return await MailServiceClient.sendWithTemplate(reqId, user.email, conf.emailVerificationEmailTempate, templateArgs);
    }

    /**
     * @param {String} reqId 
     * @param {UserModel} user 
     * 
     * @return {Promise}
     */
    static async sendMail(reqId, user) {
        let message = conf.emailVerificationMessage;
        message = EmailUtils._replaceAll(message, ":token:", user.emailVerificationToken);

        Object.keys(user).forEach(key => {
            if (message.includes(key)) {
                let val = user[key];
                switch (key) {
                    case "firstName":
                    case "middleName":
                    case "lastName":
                        val = val.substring(0, 1).toUpperCase() + user[key].substring(1);
                }
                message = EmailUtils._replaceAll(message, `:user-${key}:`, val);
            }
        });

        await MailServiceClient.send(reqId, user.email, conf.emailVerificationSubject, message);
    }

    /**
     * @param {UserModel} user user to generate email verification token for
     */
    static generateEmailVerificationToken(user) {
        return crypto.createHmac("sha256", secureRandom(256, 36) + uuid.v4() + user.email).digest("hex");
    }

    /**
     * @param {String} string 
     * @param {String} search 
     * @param {String} replacement 
     */
    static _replaceAll(string, search, replacement) {
        return string.replace(new RegExp(search, "g"), replacement);
    }

}

module.exports = EmailUtils;