import { injectable, inject, subscribe } from "@fruster/decorators";
import config from "../../config";
import errors from "../errors";
import UserRepo from "../repos/UserRepo";
import constants from "../constants";

@injectable()
class GetByAggregateHandler {

	@inject()
	private userRepo!: UserRepo;

	@subscribe({
		subject: constants.endpoints.service.GET_BY_AGGREGATE,
		requestSchema: constants.schemas.request.GET_USERS_BY_AGGREGATE,
		responseSchema: constants.schemas.response.GET_BY_AGGREGATE,
		docs: {
			description: `Gets user records by aggregate without process aggregate result`,
			errors: {
				"INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}
	})
	async handle({ data: { aggregate } }: { data: { aggregate: Record<string, unknown>[] } }) {
		const response = await this.userRepo.getByAggregate(aggregate);

		if (JSON.stringify(response).match(new RegExp(config.privateProperties)))
			throw errors.badRequest(`Cannot expose ${config.privateProperties}`);

		return {
			status: 200,
			data: response
		};
	}

}

export default GetByAggregateHandler;
