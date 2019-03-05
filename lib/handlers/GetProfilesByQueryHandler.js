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
    async handle({ data: { start, limit, filter, sort, query, caseInsensitiveSort } }) {
        this._validateQuery(query);

        if (start) start = parseInt(start || 0);

        if (limit) limit = parseInt(limit || 50);

        if (filter) filter = filter;

        if (sort) sort = sort;

        if (sort) sort = sort;

        /** @type {Array<ProfileModel>} */
        let profiles = [];

        /** @type {Number} */
        let totalCount = 0;

        try {
            [profiles, totalCount] = await this._profileManager.getProfilesByQuery(query, start, limit, filter, sort, caseInsensitiveSort);
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