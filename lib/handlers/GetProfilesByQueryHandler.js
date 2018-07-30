const FrusterRequest = require("fruster-bus").FrusterRequest;
const RoleManager = require("../managers/RoleManager");
const log = require("fruster-log");
const deprecatedErrors = require("../deprecatedErrors");
const config = require("../../config");
const ProfileModel = require("../models/ProfileModel");
const ProfileManager = require("../managers/ProfileManager");


class GetProfilesByQueryHandler {

    /**
     * @param {RoleManager} roleManager 
     * @param {ProfileManager} profileManager 
     */
    constructor(roleManager, profileManager) {
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

        /** @type {Array<ProfileModel>} */
        let profiles = [];
        /** @type {Number} */
        let totalCount = 0;

        try {
            [profiles, totalCount] = await this._profileManager.getProfilesByQuery(req.data.query, start, limit, filter, sort);
        } catch (err) {
            // Fail quitely by design - an invalid mongo query should
            // result in empty result
            log.warn(`Failed getting profiles: ${JSON.stringify(err, null, 4)}`);
        }

        return {
            status: 200,
            data: {
                totalCount,
                profiles: await Promise.all(profiles.map(p => new ProfileModel(p, !!filter).toViewModel(this._roleManager)))
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
        if (!query || (Object.keys(query).length === 0 && !config.allowGetAll))
            throw deprecatedErrors.invalidJson();
    }

}

module.exports = GetProfilesByQueryHandler;