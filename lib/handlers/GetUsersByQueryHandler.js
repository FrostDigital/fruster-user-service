const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const RoleManager = require("../managers/RoleManager");
const UserModel = require("../models/UserModel");
const log = require("fruster-log");
const deprecatedErrors = require("../deprecatedErrors");
const config = require("../../config");
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
    async handle({ data: { start, limit, filter, sort, query, expand, caseInsensitiveSort } }) {
        this._validateQuery(query);

        if (start) start = parseInt(start || 0);

        if (limit) limit = parseInt(limit || 50);

        if (filter) filter = filter;

        if (sort) sort = sort;

        /** @type {Array<UserModel>} */
        let users = [];

        /** @type {Number} */
        let totalCount = 0;

        try {
            [users, totalCount] = await this._userRepo.getUsersByQuery(query, start, limit, filter, sort, expand, caseInsensitiveSort);
        } catch (err) {
            // Fail quitely by design - an invalid mongo query should
            // result in empty result
            log.warn(`Failed getting users: ${JSON.stringify(err, null, 4)}`);
        }

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
