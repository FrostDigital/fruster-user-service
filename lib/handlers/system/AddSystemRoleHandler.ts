import { injectable, inject, subscribe } from "@fruster/decorators";
import RoleScopesDbRepo from "../../repos/RoleScopesDbRepo";
import constants from "../../constants";


/**
 * NOTE: Only instantiated (and thus only registered via @subscribe) when
 * config.useDbRolesAndScopes is enabled -- see fruster-user-service.ts.
 */
@injectable()
class AddSystemRoleHandler {

	@inject()
	private roleScopesDbRepo!: RoleScopesDbRepo;

	@subscribe({
		subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE,
		permissions: [constants.permissions.ADD_SYSTEM_ROLE],
		requestSchema: constants.schemas.request.ADD_SYSTEM_ROLE_REQUEST,
		responseSchema: constants.schemas.response.ROLE_MODEL,
		docs: {
			description: "Adds a new system role.",
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened",
				"user-service.SYSTEM_ROLE_ALREADY_EXISTS": "The provided role already exists in the system."
			}
		}
	})
	async handle(req: { data: { role: string; scopes?: string[] } }) {
		const role = req.data.role;
		const scopes = req.data.scopes || [];
		const createdRole = await this.roleScopesDbRepo.addRole(role, scopes);

		return {
			status: 200,
			data: createdRole
		};
	}

}

export default AddSystemRoleHandler;
