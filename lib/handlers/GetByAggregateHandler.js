const UserRepo = require("../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;

class GetByAggregateHandler {

	/**
	 * @param {UserRepo} userRepo
	 */
	constructor(userRepo) {
		this._userRepo = userRepo;
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handle({ data: { aggregate } }) {
		return {
			status: 200,
			data: await this._userRepo.getByAggregate(aggregate)
		};
	}

}

module.exports = GetByAggregateHandler;
