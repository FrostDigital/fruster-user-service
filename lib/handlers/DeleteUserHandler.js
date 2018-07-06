const FrusterRequest = require("fruster-bus").FrusterRequest;
const log = require("fruster-log");
const UserRepo = require("../repos/UserRepo");
const Utils = require("../utils/Utils");
const deprecatedErrors = require("../deprecatedErrors");
const Publishes = require("../Publishes");

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

        if (!Utils.validateId(id))
            throw deprecatedErrors.invalidId(id);

        await this._repo.deleteUser(id);

        await Publishes.userDeleted(req.reqId, id);

        if (req.user)
            log.audit(req.user.id, "User deleted - " + id);

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