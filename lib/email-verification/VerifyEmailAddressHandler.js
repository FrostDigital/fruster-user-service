const log = require("fruster-log");
const errors = require('../errors.js');

class VerifyEmailAddressHandler {

    constructor(database, updateUser) {
        this.database = database;
        this.updateUser = updateUser;
    }

    async handle(req) {
        req.params = req.params || {};

        const verificationToken = req.params.tokenId || req.data.tokenId || "";
        const userFromToken = await this.database.findOne({ emailVerificationToken: verificationToken });

        if (!userFromToken)
            throw errors.throw("INVALID_TOKEN", verificationToken);

        const updatedUser = await this.database.update({ id: userFromToken.id }, {
            $set: { emailVerified: true },
            $unset: { emailVerificationToken: undefined }
        });

        return {
            status: 200,
            reqId: req.reqId
        }
    }

}

module.exports = VerifyEmailAddressHandler;