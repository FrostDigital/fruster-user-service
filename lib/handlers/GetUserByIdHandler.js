const errors = require("../errors");
const log = require("fruster-log");
const UserModel = require("../models/UserModel");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const UserRepo = require("../repos/UserRepo");
const RoleManager = require("../managers/RoleManager");
const ProfileManager = require("../managers/ProfileManager");


class GetUserByIdHandler {

	/**
	 * @param {UserRepo} userRepo 
	 * @param {RoleManager} roleManager 
	 * @param {ProfileManager} profileManager 
	 */
	constructor(userRepo, roleManager, profileManager) {
		this._userRepo = userRepo;
		this._roleManager = roleManager;
		this._profileManager = profileManager;
	}

	/**
	 * @param  {FrusterRequest} req
	 * @return {Promise} response promise
	 */
	async handleHttp(req) {
		req.query = req.query || {};

		let user;

		try {
			user = await this._userRepo.getById(req.params.id);
		} catch (err) {
			log.error(err);
			throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", "Failed retrieving user from database");
		}

		if (!user)
			throw errors.get("fruster-user-service.NOT_FOUND", req.params.id);

		if (req.query.expand)
			user = await this._profileManager.expandUserWithProfile(user);

		return {
			status: 200,
			data: await new UserModel(user).toViewModel(this._roleManager)
		};
	}

}

module.exports = GetUserByIdHandler;