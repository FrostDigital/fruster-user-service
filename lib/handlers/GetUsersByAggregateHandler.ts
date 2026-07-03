import { injectable, inject, subscribe } from "@fruster/decorators";
import UserRepo from "../repos/UserRepo";
import RoleManager from "../managers/RoleManager";
import constants from "../constants";

@injectable()
class GetUsersByAggregateHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private roleManager!: RoleManager;

	@subscribe({
		subject: constants.endpoints.service.GET_USERS_BY_AGGREGATE,
		requestSchema: constants.schemas.request.GET_USERS_BY_AGGREGATE,
		responseSchema: constants.schemas.response.GET_USERS_BY_AGGREGATE,
		docs: {
			description: `Gets users by aggregate. The result process with view model`,
			errors: {
				"INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}
	})
	async handle({ data: { aggregate } }: { data: { aggregate: Record<string, unknown>[] } }) {
		const users: any[] = await this.userRepo.getUserByAggregate(aggregate);

		for (let i in users)
			users[i] = await users[i].toViewModel(this.roleManager);

		return {
			status: 200,
			data: { users }
		};
	}

}

export default GetUsersByAggregateHandler;
