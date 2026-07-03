import { injectable, inject, subscribe } from "@fruster/decorators";
import RoleScopesDbRepo from "../../repos/RoleScopesDbRepo";
import { errors } from "@fruster/bus";
import constants from "../../constants";


/**
 * NOTE: Only instantiated (and thus only registered via @subscribe) when
 * config.useDbRolesAndScopes is enabled -- see fruster-user-service.ts.
 */
@injectable()
class RemoveSystemRoleHandler {

	@inject()
	private roleScopesDbRepo!: RoleScopesDbRepo;

	@subscribe({
		subject: constants.endpoints.http.admin.REMOVE_SYSTEM_ROLE,
		permissions: [constants.permissions.REMOVE_SYSTEM_ROLE],
		requestSchema: constants.schemas.request.REMOVE_SYSTEM_ROLE_REQUEST,
		docs: {
			description: "Removes a system role.",
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
			}
		}
	})
	async handle(req: { data: { role: string } }) {
		if (req.data.role === "super-admin")
			throw errors.get("fruster-user-service.CANNOT_DELETE_SUPER_ADMIN");

		await this.roleScopesDbRepo.removeRole(req.data.role);

		return {
			status: 200
		};
	}

}

export default RemoveSystemRoleHandler;
