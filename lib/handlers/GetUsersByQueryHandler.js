const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const RoleService = require("../services/RoleService");
const UserModel = require("../models/UserModel");
const log = require("fruster-log");
const deprecatedErrors = require("../deprecatedErrors");
const config = require("../../config");


class GetUsersByQueryHandler {

    /**
     * @param {UserRepo} userRepo 
     * @param {RoleService} roleService 
     */
    constructor(userRepo, roleService) {
        this._repo = userRepo;
        this._roleService = roleService;
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

        /** @type {Array<UserModel>} */
        let users = [];
        /** @type {Number} */
        let totalCount;

        try {
            [users, totalCount] = await this._repo.getUsersByQuery(req.data.query, start, limit, filter, sort);
        } catch (err) {
            // Fail quitely by design - an invalid mongo query should
            // result in empty result
            log.warn(`Failed getting users: ${err}`);
        }

        return {
            status: 200,
            data: {
                totalCount,
                users: await Promise.all(users.map(u => new UserModel(u, !!filter).toViewModel(this._roleService)))
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
        if (!query || (Object.keys(query).length === 0 && !config.allowGetAll) || query.password || query.salt) {
            throw deprecatedErrors.invalidJson();
        }
    }

}

module.exports = GetUsersByQueryHandler;