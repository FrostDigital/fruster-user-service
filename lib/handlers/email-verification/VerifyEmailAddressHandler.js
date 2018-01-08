const log = require("fruster-log");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const errors = require('../../errors.js');
const UserRepo = require("../../repos/UserRepo");


class VerifyEmailAddressHandler {

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

        const verificationToken = req.params.tokenId || req.data.tokenId || "";
        const userFromToken = await this._repo.getUserByQuery({ emailVerificationToken: verificationToken });

        if (!userFromToken)
            throw errors.throw("INVALID_TOKEN", verificationToken);

        await this._repo.updateUser(userFromToken.id,
            { emailVerified: true },
            { emailVerificationToken: undefined });

        return {
            status: 200,
            data: { verifiedEmail: userFromToken.email }
        }
    }

}

module.exports = VerifyEmailAddressHandler;