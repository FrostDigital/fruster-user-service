const errors = require("../errors");
const log = require("fruster-log");
const UserModel = require("../models/UserModel");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserRepo = require("../repos/UserRepo");
const RoleManager = require("../managers/RoleManager");


class GetUserByIdHandler {

	/**
	 * @param {UserRepo} userRepo 
	 * @param {RoleManager} roleManager 
	 */
	constructor(userRepo, roleManager) {
		this._repo = userRepo;
		this._roleManager = roleManager;
	}

	/**
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

		if (!user)
			errors.throw("NOT_FOUND", req.params.id);

		return {
			status: 200,
			data: await new UserModel(user).toViewModel(this._roleManager)
		};
	}

}

module.exports = GetUserByIdHandler;