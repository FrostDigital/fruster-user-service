const errors = require("../errors");
const log = require("fruster-log");
const utils = require("../utils/utils");
const UserModel = require("../models/UserModel");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserRepo = require("../repos/UserRepo");
const RoleService = require("../services/RoleService");


class GetUserByIdHandler {

	/**
	 * 
	 * @param {UserRepo} userRepo 
	 * @param {RoleService} roleService 
	 */
	constructor(userRepo, roleService) {
		this._repo = userRepo;
		this._roleService = roleService;
	}

	handle(req) { }

	/**
	 * HTTP handler for getting users. Is only exposed for admins.
	 * 
	 * @param  {FrusterRequest} req
	 * @return {Promise} response promise
	 */
	async handleHttp(req) {
		let user;

		try {
			user = await this._repo.getById(req.params.id);
		} catch (err) {
			log.error(err);
			errors.throw("INTERNAL_SERVER_ERROR", "Failed retrieving user from database");
		}

		if (!user) {
			errors.throw("NOT_FOUND", req.params.id);
		}

		return {
			status: 200,
			data: new UserModel(user).toViewModel(this._roleService)
		};
	}

}

module.exports = GetUserByIdHandler;