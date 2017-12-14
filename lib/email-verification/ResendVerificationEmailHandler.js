const _ = require("lodash");
const emailUtils = require('../utils/email-utils.js');
const errors = require('../errors.js');
const config = require("../../config");


class ResendVerificationEmailHandler {

    constructor(database) {
        this.database = database;
    }

    async handle(req) {
        req.params = req.params || {};

        const email = req.params.email || req.data.email;
        const user = await this.database.findOne({ email: email });

        // Note: Checks explicitly if user.data[0].emailVerified is false, not if it is undefined/lacking value.
        if (_.size(user) > 0 && user.hasOwnProperty("emailVerified") && user.emailVerified === false) {
            user.emailVerificationToken = emailUtils.generateEmailVerificationToken(user);

            try {
                await this.database.update({ id: user.id },
                    { $set: { emailVerificationToken: user.emailVerificationToken } });
            } catch (err) {
                throw errors.throw("INTERNAL_SERVER_ERROR", err);
            }

            if (config.emailVerificationEmailTempate)
                await emailUtils.sendMailWithTemplate(req.reqId, user, user.emailVerificationToken);
            else
                await emailUtils.sendMail(req.reqId, user);
        }

        return {
            status: 200,
            reqId: req.reqId
        };
    }

}

module.exports = ResendVerificationEmailHandler;