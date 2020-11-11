const config = require("../../config");
const errors = require("../errors");
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
		const response = await this._userRepo.getByAggregate(aggregate);

		if (JSON.stringify(response).match(new RegExp(config.privateProperties)))
			throw errors.badRequest(`Cannot expose ${config.privateProperties}`);

		return {
			status: 200,
			data: response
		};
	}

}

module.exports = GetByAggregateHandler;
