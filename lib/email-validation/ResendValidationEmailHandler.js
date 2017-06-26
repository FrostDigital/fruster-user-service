const _ = require("lodash");
const emailUtils = require('../utils/email-utils.js');
const errors = require('../errors.js');

class ResendValidationEmailHandler {

    constructor(database) {
        this.database = database;
    }

    async handle(req) {
        req.params = req.params || {};

        const email = req.params.email;
        const user = await this.database.findOne({ email: email });

        // Note: Checks explicitly if user.data[0].emailValidated is false, not if it is undefined or lacking value.
        if (_.size(user) > 0 && user.emailValidated === false) {
            user.emailValidationToken = emailUtils.generateEmailValidationToken(user);

            try {
                await this.database.update({ id: user.id },
                    { $set: { emailValidationToken: emailUtils.generateEmailValidationToken(user) } });
            } catch (err) {
                throw errors.throw("INTERNAL_SERVER_ERROR", err);
            }

            await emailUtils.sendMail(req.reqId, user);
        }

        return {
            status: 200,
            reqId: req.reqId
        };
    }

}

module.exports = ResendValidationEmailHandler;