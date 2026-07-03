import { injectable, inject, subscribe } from "@fruster/decorators";
import RoleScopesDbRepo from "../../repos/RoleScopesDbRepo";
import errors from "../../errors";
import constants from "../../constants";


/**
 * NOTE: Only instantiated (and thus only registered via @subscribe) when
 * config.useDbRolesAndScopes is enabled -- see fruster-user-service.ts.
 */
@injectable()
class RemoveSystemRoleScopesHandler {

	@inject()
	private roleScopesDbRepo!: RoleScopesDbRepo;

	@subscribe({
		subject: constants.endpoints.http.admin.REMOVE_SYSTEM_ROLE_SCOPES,
		permissions: [constants.permissions.REMOVE_SYSTEM_ROLE_SCOPES],
		requestSchema: constants.schemas.request.REMOVE_SYSTEM_ROLE_SCOPES_REQUEST,
		responseSchema: constants.schemas.response.ROLE_MODEL,
		docs: {
			description: "Removes one or more scopes from a system role.",
			params: {
				role: "The role to remove the provided scope(s) from."
			},
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
			}
		}
	})
	async handle(req: { data: { role: string; scopes: string[] } }) {
		if (req.data.role === "super-admin" && req.data.scopes.includes("*"))
			throw errors.get("fruster-user-service.CANNOT_DELETE_SUPER_ADMIN");

		const roleRemovedFrom = await this.roleScopesDbRepo.removeScopesFromRole(req.data.role, req.data.scopes);

		return {
			status: 200,
			data: roleRemovedFrom
		};
	}

}

export default RemoveSystemRoleScopesHandler;
