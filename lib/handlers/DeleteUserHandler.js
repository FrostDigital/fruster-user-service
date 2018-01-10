const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserRepo = require("../repos/UserRepo");
const utils = require("../utils/utils");
const deprecatedErrors = require("../deprecatedErrors");


class DeleteUserHandler {

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
        const id = req.data.id;

        if (!utils.validateId(id))
            throw deprecatedErrors.invalidId(id);

        await this._repo.deleteUser(id);

        return {
            status: 200
        }
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handleHttp(req) {
        req.data = req.data || {};
        req.data.id = req.params.id;

        return this.handle(req);
    }

}

module.exports = DeleteUserHandler;