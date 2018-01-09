const utils = require("../utils/utils");
const log = require("fruster-log");
const config = require("../../config");
const UserRepo = require("../repos/UserRepo");
const deprecatedErrors = require("../deprecatedErrors");
const UserModel = require("../models/UserModel");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const RoleService = require("../services/RoleService");


class GetUserHandler {

	/**
	 * @param {UserRepo} repo 
	 * @param {RoleService} roleService 
	 */
	constructor(repo, roleService) {
		this._repo = repo;
		this._roleService = roleService;
	}

	/**
	 * Internal handler for service calls to get users
	 * and filter by query. 
	 * 
	 * Note that service is by default configured to block attempts to get ALL users 
	 * (i.e. by sending an empty query). This can be enabled by changing config `ALLOW_GET_ALL`.
	 * 
	 * @param  {FrusterRequest} req 
	 * 
	 * @return {Promise} response promise
	 */
	async handle(req) {
		this._validateQuery(req.data);

		let users = [];

		try {
			users = await this._repo.getUsersByQuery(req.data);
		} catch (err) {
			// Fail quitely by design - an invalid mongo query should
			// result in empty result
			log.warn(`Failed getting users: ${err}`);
		}

		return {
			status: 200,
			data: users.map(u => new UserModel(u).toViewModel(this._roleService))
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
	async handleHttp(req) {
		let users = [];
		let pagination;

		if (req.query.start || req.query.limit) {
			pagination = {
				limit: parseInt(req.query.limit || 50),
				skip: parseInt(req.query.start || 0)
			};
		}

		// Remove pagination specific query params to avoid 
		// polluting the mongo query
		delete req.query.limit;
		delete req.query.start;

		users = await this._repo.getUsersByQuery(req.query, pagination);

		return {
			status: 200,
			data: users.map(u => new UserModel(u).toViewModel(this._roleService))
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