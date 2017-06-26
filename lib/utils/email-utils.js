const uuid = require("uuid");
const mailServiceClient = require('../clients/mail-service-client.js');
const conf = require('../../config.js');
const crypto = require('crypto');

module.exports = {

    sendMail: async (reqId, user) => {
        let message = conf.emailValidationMessage;
        message = replaceAll(message, ":token:", user.emailValidationToken);

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

        await mailServiceClient.send(reqId, user.email, conf.emailValidationSubject, message);
    },

    generateEmailValidationToken: (user) => {
        return crypto.createHmac("sha256", uuid.v4() + "-" + uuid.v4() + user.email).digest("hex");
    }

};

function replaceAll(string, search, replacement) {
    return string.replace(new RegExp(search, 'g'), replacement);
};