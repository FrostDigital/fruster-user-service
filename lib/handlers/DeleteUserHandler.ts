import { injectable, inject, subscribe } from "@fruster/decorators";
import log from "@fruster/log";
import UserRepo from "../repos/UserRepo";
import ProfileRepo from "../repos/ProfileRepo";
import Publishes from "../Publishes";
import constants from "../constants";


@injectable()
class DeleteUserHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private profileRepo!: ProfileRepo;

	@subscribe({
		subject: constants.endpoints.service.DELETE_USER,
		requestSchema: constants.schemas.request.DELETE_USER_REQUEST,
		docs: {
			description: `Deletes a user. Response has status code \`200\` if successful. \`${Publishes.subjects.USER_DELETED}\` is published after deletion`,
			errors: {
				"user-service.NOT_FOUND": "User not found",
				"user-service.400.12": "Invalid id. Provided id does not follow the configured id validation.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}
	})
	async handle(req: { data: { id: string }; reqId?: string; user?: { id: string } }) {
		const id = req.data.id;

		await this.userRepo.deleteUser(id);
		/** If there is no profile, we don't care */
		await this.profileRepo.deleteProfile(id);

		await Publishes.userDeleted(req.reqId, id);

		if (req.user)
			log.audit(req.user.id, "User and profile deleted - " + id);

		return {
			status: 200
		};
	}

	@subscribe({
		subject: constants.endpoints.http.admin.DELETE_USER,
		permissions: [constants.permissions.ADMIN_ANY],
		mustBeLoggedIn: true,
		docs: {
			description: `Deletes a user. Response has status code \`200\` if successful. \`${Publishes.subjects.USER_DELETED}\` is published after deletion`,
			errors: {
				"user-service.NOT_FOUND": "User not found",
				"user-service.400.12": "Invalid id. Provided id does not follow the configured id validation.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			},
			params: {
				id: "The id of the user to delete."
			}
		}
	})
	async handleHttp(req: { data?: { id: string }; params: Record<string, any>; reqId?: string; user?: { id: string } }) {
		req.data = req.data || ({} as { id: string });
		req.data.id = req.params.id;

		return this.handle(req as { data: { id: string }; reqId?: string; user?: { id: string } });
	}

}

export default DeleteUserHandler;
