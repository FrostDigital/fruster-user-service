const FrusterRequest = require("fruster-bus").FrusterRequest;
const log = require("fruster-log");
const UserRepo = require("../repos/UserRepo");
const ProfileRepo = require("../repos/ProfileRepo");
const Publishes = require("../Publishes");

class DeleteUserHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {ProfileRepo} profileRepo 
     */
    constructor(userRepo, profileRepo) {
        this._userRepo = userRepo;
        this._profileRepo = profileRepo;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        const id = req.data.id;

        await this._userRepo.deleteUser(id);
        /** If there is no profile, we don't care */
        await this._profileRepo.deleteProfile(id);

        await Publishes.userDeleted(req.reqId, id);

        if (req.user)
            log.audit(req.user.id, "User and profile deleted - " + id);

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