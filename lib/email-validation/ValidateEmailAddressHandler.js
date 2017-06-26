const log = require("fruster-log");
const errors = require('../errors.js');

class ValidateEmailAddressHandler {

    constructor(database, updateUser) {
        this.database = database;
        this.updateUser = updateUser;
    }

    async handle(req) {
        const validationToken = req.params.tokenId || "";
        const userFromToken = await this.database.findOne({ emailValidationToken: validationToken });

        if (!userFromToken)
            throw errors.throw("INVALID_TOKEN", validationToken);

        const updatedUser = await this.database.update({ id: userFromToken.id }, {
            $set: { emailValidated: true },
            $unset: { emailValidationToken: undefined }
        });

        return {
            status: 200,
            data: updatedUser,
            reqId: req.reqId
        }
    }

}

module.exports = ValidateEmailAddressHandler;