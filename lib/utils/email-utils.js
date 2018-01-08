const uuid = require("uuid");
const MailServiceClient = require("../clients/MailServiceClient");
const mailServiceClient = new MailServiceClient();
const conf = require("../../config.js");
const crypto = require("crypto");
const secureRandom = require("csprng");

module.exports = {

    sendMailWithTemplate: async (reqId, user, token) => {
        const templateArgs = {
            user, token
        };
        return await mailServiceClient.sendWithTemplate(reqId, user.email, conf.emailVerificationEmailTempate, templateArgs);
    },

    sendMail: async (reqId, user) => {
        let message = conf.emailVerificationMessage;
        message = replaceAll(message, ":token:", user.emailVerificationToken);

        Object.keys(user).forEach(key => {
            if (message.includes(key)) {
                let val = user[key];
                switch (key) {
                    case "firstName":
                    case "middleName":
                    case "lastName":
                        val = val.substring(0, 1).toUpperCase() + user[key].substring(1);
                }
                message = replaceAll(message, `:user-${key}:`, val);
            }
        });

        await mailServiceClient.send(reqId, user.email, conf.emailVerificationSubject, message);
    },

    generateEmailVerificationToken: (user) => {
        return crypto.createHmac("sha256", secureRandom(256, 36) + uuid.v4() + user.email).digest("hex");
    }

};

function replaceAll(string, search, replacement) {
    return string.replace(new RegExp(search, "g"), replacement);
};