const log = require("fruster-log");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const errors = require('../errors.js');

class VerifyEmailAddressHandler {

    /**
     * @param {Object} database mongodb database
     * @param {Object} updateUser handler for updating user(s)
     */
    constructor(database, updateUser) {
        this.database = database;
        this.updateUser = updateUser;
    }

    /**
     * @param {FrusterRequest} req 
     */
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
            data: {
                verifiedEmail: userFromToken.email
            }
        }
    }

}

module.exports = VerifyEmailAddressHandler;