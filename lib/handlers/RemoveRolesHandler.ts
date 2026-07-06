import { injectable, inject, subscribe } from "@fruster/decorators";
import UserRepo from "../repos/UserRepo";
import RoleManager from "../managers/RoleManager";
import deprecatedErrors from "../deprecatedErrors";
import UserModel from "../models/UserModel";
import constants from "../constants";


@injectable()
class RemoveRolesHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private roleManager!: RoleManager;

	@subscribe({
		subject: constants.endpoints.service.REMOVE_ROLES,
		requestSchema: constants.schemas.request.ADD_AND_REMOVE_ROLES_REQUEST,
		docs: {
			description: "Removes inputted roles from specified user. Cannot remove the last role. Response has status code `202` if successful.",
			errors: {
				"user-service.404.1": "User not found.",
				"user-service.400.4": "Invalid roles. One or more inputted roles are invalid.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}
	})
	async handle(req: { data: { id: string; roles: string[] } }) {
		const id = req.data.id;
		const roles = req.data.roles;
		const invalidRoles = await this.roleManager.validateRoles(roles);

		if (invalidRoles.length > 0)
			throw deprecatedErrors.invalidRoles(invalidRoles);

		const user = await this.userRepo.getById(id);

		if ((user as UserModel).roles!.length === 1 && roles.includes((user as UserModel).roles![0]))
			throw deprecatedErrors.cannotRemoveLastRole();

		await this.userRepo.removeRolesForUser(id, roles);

		return {
			status: 202
		};
	}

}

export default RemoveRolesHandler;
