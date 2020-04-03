const UserRepo = require("../repos/UserRepo");
const RoleManager = require("../managers/RoleManager");
const FrusterRequest = require("fruster-bus").FrusterRequest;

class GetUsersByAggregateHandler {

	/**
	 * @param {UserRepo} userRepo
	 * @param {RoleManager} roleManager
	 */
	constructor(userRepo, roleManager) {
		this._userRepo = userRepo;
		this._roleManager = roleManager;
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handle({ data: { aggregate } }) {
		const users = await this._userRepo.getUserByAggregate(aggregate);

		for (let i in users)
			users[i] = await users[i].toViewModel(this._roleManager);

		return {
			status: 200,
			data: { users }
		};
	}

}

module.exports = GetUsersByAggregateHandler;
