const FrusterRequest = require("fruster-bus").FrusterRequest;
const log = require("fruster-log");
const UserRepo = require("../repos/UserRepo");
const ProfileRepo = require("../repos/ProfileRepo");
const Publishes = require("../Publishes");
const errors = require("../errors");


class DeleteUsersByQueryHandler {

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
        const query = req.data;

        if (!query || Object.keys(query).length === 0)
            throw errors.get("BAD_REQUEST", "Invalid query; query cannot be empty");

        const userIds = await this._userRepo.deleteUsersByQuery(query);
        /** If there is no profile, we don't care */
        await this._profileRepo.deleteProfiles(userIds);

        log.info("Users", userIds, "were removed");

        await Promise.all(userIds.map(id => Publishes.userDeleted(req.reqId, id)));

        return {
            status: 200
        }
    }

}

module.exports = DeleteUsersByQueryHandler;