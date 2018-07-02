const UserRepo = require("../repos/UserRepo");
const ProfileRepo = require("../repos/ProfileRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const RoleManager = require("../managers/RoleManager");
const UserModel = require("../models/UserModel");
const log = require("fruster-log");
const deprecatedErrors = require("../deprecatedErrors");
const config = require("../../config");
const ProfileModel = require("../models/ProfileModel");
const ProfileManager = require("../managers/ProfileManager");


class GetUsersByQueryHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {RoleManager} roleManager 
     * @param {ProfileManager} profileManager 
     */
    constructor(userRepo, roleManager, profileManager) {
        this._userRepo = userRepo;
        this._roleManager = roleManager;
        this._profileManager = profileManager;
    }

    /**
     * @param {FrusterRequest} req 
     */
    async handle(req) {
        this._validateQuery(req.data);

        let start;
        let limit;
        let filter;
        let sort;

        if (req.data.start)
            start = parseInt(req.data.start || 0);

        if (req.data.limit)
            limit = parseInt(req.data.limit || 50);

        if (req.data.filter)
            filter = req.data.filter;

        if (req.data.sort)
            sort = req.data.sort;

        if (req.data.sort)
            sort = req.data.sort;

        /** @type {Array<UserModel>} */
        let users = [];
        /** @type {Number} */
        let totalCount = 0;

        try {
            [users, totalCount] = await this._userRepo.getUsersByQuery(req.data.query, start, limit, filter, sort);
        } catch (err) {
            // Fail quitely by design - an invalid mongo query should
            // result in empty result
            log.warn(`Failed getting users: ${JSON.stringify(err, null, 4)}`);
        }

        if (req.data.expand)
            users = await this._profileManager.expandUsersWithProfiles(users, filter);

        return {
            status: 200,
            data: {
                totalCount,
                users: await Promise.all(users.map(u => new UserModel(u, !!filter).toViewModel(this._roleManager)))
            }
        };
    }

    /**
     * Validates inputted query
     * 
     * @param {Object} query 
     * 
     * @return {Void}
     */
    _validateQuery(query) {
        if (!query || (Object.keys(query).length === 0 && !config.allowGetAll) || query.password || query.salt)
            throw deprecatedErrors.invalidJson();
    }

}

module.exports = GetUsersByQueryHandler;