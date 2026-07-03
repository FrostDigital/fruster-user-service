import { injectable, inject, subscribe } from "@fruster/decorators";
import errors from "../errors";
import log from "@fruster/log";
import UserModel from "../models/UserModel";
import UserRepo from "../repos/UserRepo";
import RoleManager from "../managers/RoleManager";
import ProfileManager from "../managers/ProfileManager";
import constants from "../constants";


@injectable()
class GetUserByIdHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private roleManager!: RoleManager;

	@inject()
	private profileManager!: ProfileManager;

	@subscribe({
		subject: constants.endpoints.http.admin.GET_USER,
		responseSchema: constants.schemas.response.USER_RESPONSE,
		permissions: [constants.permissions.ADMIN_ANY],
		mustBeLoggedIn: true,
		docs: {
			description: "Gets user by id. Response has status code `200` if successful.",
			errors: {
				"user-service.NOT_FOUND": "User not found.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			},
			params: {
				id: "The id of the user to get."
			}
		}
	})
	async handleHttp(req: { params: Record<string, any>; query?: Record<string, any> }) {
		req.query = req.query || {};

		let user;

		try {
			user = await this.userRepo.getById(req.params.id);
		} catch (err) {
			log.error(err);
			throw errors.get("fruster-user-service.INTERNAL_SERVER_ERROR", "Failed retrieving user from database");
		}

		if (!user)
			throw errors.get("fruster-user-service.NOT_FOUND", req.params.id);

		if (req.query.expand)
			user = await this.profileManager.expandUserWithProfile(user);

		return {
			status: 200,
			data: await new UserModel(user).toViewModel(this.roleManager)
		};
	}

}

export default GetUserByIdHandler;
