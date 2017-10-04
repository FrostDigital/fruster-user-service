const utils = require("./utils/utils");
const log = require("fruster-log");
const config = require("../config");

class GetUserHandler {

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
	 * @param  {object} req 
	 * @return {Promise} response promise
	 */
	async handle(req) {
		this._validateQuery(req.data);
		
		let users = [];
		
		try {
			users = await this.repo.getUsers(req.data);			
		} catch(err) {
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
	 * @param  {object} req
	 * @return {Promise} response promise
	 */
	handleHttp(req) {
		req.data = req.query;
		return this.handle(req);		
	}

	_validateQuery(query) {
		if (!query || (Object.keys(query).length === 0 && !config.allowGetAll) || query.password || query.salt) {
			throw utils.errors.invalidJson();			
		}			
	}
	
}

module.exports = GetUserHandler;