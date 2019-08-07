const log = require("fruster-log");
const config = require("../../config");
const UserRepo = require("../repos/UserRepo");
const deprecatedErrors = require("../deprecatedErrors");
const UserModel = require("../models/UserModel");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const RoleManager = require("../managers/RoleManager");


class GetUserHandler {

	/**
	 * @param {UserRepo} repo
	 * @param {RoleManager} roleManager
	 */
	constructor(repo, roleManager) {
		this._repo = repo;
		this._roleManager = roleManager;
	}

	/**
	 * NOTE: This endpoint is deprecated!
	 *
	 * Internal handler for manager calls to get users
	 * and filter by query.
	 *
	 * Note that manager is by default configured to block attempts to get ALL users
	 * (i.e. by sending an empty query). This can be enabled by changing config `ALLOW_GET_ALL`.
	 *
	 * @param  {FrusterRequest} req
	 *
	 * @return {Promise} response promise
	 */
	async handle({ data }) {
		this._validateQuery(data);

		let users = [];

		try {
			[users] = await this._repo.getUsersByQuery({ query: data });
		} catch (err) {
			// Fail quitely by design - an invalid mongo query should
			// result in empty result
			log.warn(`Failed getting users: ${JSON.stringify(err, null, 4)}`);
		}

		return {
			status: 200,
			data: await Promise.all(users.map(u => new UserModel(u).toViewModel(this._roleManager)))
		};
	}

	/**
	 * HTTP handler for getting users. Is only exposed for admins.
	 * Will use HTTP query as mongo query
	 *
	 * Can do pagination if query param `start` is set. If so
	 * results will start from that entry with default page size
	 * of 50. Page size can be set by setting query param `limit`.
	 *
	 * @param  {FrusterRequest} req
	 *
	 * @return {Promise} response promise
	 */
	async handleHttp({ query: { start, limit, ...query } }) {
		if (start)
			// @ts-ignore
			start = parseInt(start || 0);

		if (limit)
			// @ts-ignore
			limit = parseInt(limit || 50);

		// @ts-ignore
		let [users] = await this._repo.getUsersByQuery({ query, start, limit });

		return {
			status: 200,
			data: await Promise.all(users.map(u => new UserModel(u).toViewModel(this._roleManager)))
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

module.exports = GetUserHandler;
