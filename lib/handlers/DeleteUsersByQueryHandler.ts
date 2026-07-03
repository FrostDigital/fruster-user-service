import { injectable, inject, subscribe } from "@fruster/decorators";
import log from "@fruster/log";
import UserRepo from "../repos/UserRepo";
import ProfileRepo from "../repos/ProfileRepo";
import Publishes from "../Publishes";
import errors from "../errors";
import constants from "../constants";


@injectable()
class DeleteUsersByQueryHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private profileRepo!: ProfileRepo;

	@subscribe({
		subject: constants.endpoints.service.DELETE_USERS_BY_QUERY,
		requestSchema: constants.schemas.request.DELETE_USERS_BY_QUERY,
		docs: {
			description: `Deletes users by a query. Response has status code \`200\` if successful. \`${Publishes.subjects.USER_DELETED}\` is published after deletion. Request body is the query to delete with. Cannot use empty query.`,
			errors: {
				"fruster-user-service.BAD_REQUEST": "Invalid query; query cannot be empty"
			}
		}
	})
	async handle(req: { data: Record<string, unknown>; reqId?: string }) {
		const query = req.data;

		if (!query || Object.keys(query).length === 0)
			throw errors.get("fruster-user-service.BAD_REQUEST", "Invalid query; query cannot be empty");

		const userIds = await this.userRepo.deleteUsersByQuery(query);
		/** If there is no profile, we don't care */
		await this.profileRepo.deleteProfiles(userIds);

		log.info("Users", userIds, "were removed");

		await Promise.all(userIds.map(id => Publishes.userDeleted(req.reqId, id)));

		return {
			status: 200
		};
	}

}

export default DeleteUsersByQueryHandler;
