import { injectable, inject, subscribe } from "@fruster/decorators";
import UserRepo from "../repos/UserRepo";
import RoleManager from "../managers/RoleManager";
import deprecatedErrors from "../deprecatedErrors";
import constants from "../constants";


@injectable()
class AddRolesHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private roleManager!: RoleManager;

	@subscribe({
		subject: constants.endpoints.service.ADD_ROLES,
		requestSchema: constants.schemas.request.ADD_AND_REMOVE_ROLES_REQUEST,
		docs: {
			description: "Adds inputted roles to specified user. Can only add roles existing in configuration. Response has status code `202` if successful.",
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

		if (!user)
			throw deprecatedErrors.userNotFound(id);

		const rolesToAdd: string[] = [];

		roles.forEach(role => {
			if (!(user.roles as string[]).includes(role))
				rolesToAdd.push(role);
		});

		await this.userRepo.addRolesForUser(id, rolesToAdd);

		return {
			status: 202
		};
	}

}

export default AddRolesHandler;
