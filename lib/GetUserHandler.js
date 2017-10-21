const utils = require("./utils/utils");
const log = require("fruster-log");
const config = require("../config");
const UserRepo = require("./repos/UserRepo");
const errors = require("./errors");

class GetUserHandler {

	/**
	 * 
	 * @param {UserRepo} repo 
	 */
	constructor(repo) {
		this.repo = repo;
	}

	/**
	 * Internal handler for service calls to get users
	 * and filter by query. 
	 * 
	 * Note that service is by default configured to block attempts to get ALL users 
	 * (i.e. by sending an empty query). This can be enabled by changing config `ALLOW_GET_ALL`.
	 * 
	 * @param  {Object} req 
	 * @return {Promise} response promise
	 */
	async handle(req) {
		this._validateQuery(req.data);
		
		let users = [];
		
		try {
			users = await this.repo.getUsers(req.data);			
		} catch(err) {
			// Fail quitely by design - an invalid mongo query should
			// result in empty result
			log.warn(`Failed getting users: ${err}`);			
		}

		return {
			status: 200,
			data: users.map(utils.cleanUserModelOutput)
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
	 * @param  {Object} req
	 * @return {Promise} response promise
	 */
	async handleHttp(req) {
		let users = [];
		let pagination;
		
		if (req.query.start || req.query.limit) {
			pagination = {
				limit: parseInt(req.query.limit || 50),
				skip: parseInt(req.query.start || 0)
			};
		}
		
		// Remove pagination specific query params to avoid 
		// polluting the mongo query
		delete req.query.limit;
		delete req.query.start;

		users = await this._getUsers(req.query, pagination);
	
		return {
			status: 200,
			data: users.map(utils.cleanUserModelOutput)
		};		
	}

	_validateQuery(query) {
		if (!query || (Object.keys(query).length === 0 && !config.allowGetAll) || query.password || query.salt) {
			throw utils.errors.invalidJson();			
		}			
	}

	async _getUsers(query, pagination) {
		try {
			return await this.repo.getUsers(query, pagination);			
		} catch(err) {
			errors.throw("INTERNAL_SERVER_ERROR", err);	
		}
	}
	
}

module.exports = GetUserHandler;