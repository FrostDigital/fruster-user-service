const emailUtils = require('../../utils/email-utils.js');
const errors = require('../../errors.js');
const config = require("../../../config");
const UserRepo = require("../../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;


class ResendVerificationEmailHandler {

    /**
     * @param {UserRepo} userRepo 
     */
    constructor(userRepo) {
        this._repo = userRepo;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        req.params = req.params || {};

        const email = req.params.email || req.data.email;
        const user = await this._repo.getUserByQuery({ email: email });

        if (Object.keys(user).length > 0 &&
            user.hasOwnProperty("emailVerified") &&
            ("emailVerified" in user && user.emailVerified === false)) {
            user.emailVerificationToken = emailUtils.generateEmailVerificationToken(user);

            try {
                await this._repo.updateUser(user.id, { emailVerificationToken: user.emailVerificationToken });
            } catch (err) {
                throw errors.throw("INTERNAL_SERVER_ERROR", err);
            }

            if (config.emailVerificationEmailTempate)
                await emailUtils.sendMailWithTemplate(req.reqId, user, user.emailVerificationToken);
            else
                await emailUtils.sendMail(req.reqId, user);
        }

        return {
            status: 200
        };
    }

}

module.exports = ResendVerificationEmailHandler;