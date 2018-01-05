const errors = require("./errors");
const log = require("fruster-log");
const utils = require("./utils/utils");
const UserModel = require("./models/UserModel");


class GetUserByIdHandler {

	constructor(repo) {
		this.repo = repo;
	}

	handle(req) { }

	/**
	 * HTTP handler for getting users. Is only exposed for admins.
	 * 
	 * @param  {object} req
	 * @return {Promise} response promise
	 */
	async handleHttp(req) {
		let user;

		try {
			user = await this.repo.getById(req.params.id);
		} catch (err) {
			log.error(err);
			errors.throw("INTERNAL_SERVER_ERROR", "Failed retrieving user from database");
		}

		if (!user) {
			errors.throw("NOT_FOUND", req.params.id);
		}

		return {
			status: 200,
			data: new UserModel(user).toViewModel()
		};
	}

}

module.exports = GetUserByIdHandler;