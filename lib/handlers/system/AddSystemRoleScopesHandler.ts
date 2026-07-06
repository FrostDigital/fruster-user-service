import { injectable, inject, subscribe } from "@fruster/decorators";
import RoleScopesDbRepo from "../../repos/RoleScopesDbRepo";
import constants from "../../constants";


/**
 * NOTE: Only instantiated (and thus only registered via @subscribe) when
 * config.useDbRolesAndScopes is enabled -- see fruster-user-service.ts.
 *
 * NOTE: Uses loose inline request typing (not FrusterRequest<T>) because
 * requestSchema/responseSchema are already set explicitly above -- wrapping
 * the parameter in FrusterRequest<T> with an inline (non-named-interface)
 * type argument makes @fruster/ts-transformer crash trying to auto-generate
 * a schema from it (it requires a named interface/type, not an inline
 * object type). Since a schema is already provided manually, there's
 * nothing to auto-generate here.
 */
@injectable()
class AddSystemRoleScopesHandler {

	@inject()
	private roleScopesDbRepo!: RoleScopesDbRepo;

	@subscribe({
		subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE_SCOPES,
		permissions: [constants.permissions.ADD_SYSTEM_ROLE_SCOPES],
		requestSchema: constants.schemas.request.ADD_SYSTEM_ROLE_SCOPES_REQUEST,
		responseSchema: constants.schemas.response.ROLE_MODEL,
		docs: {
			description: "Adds one or more scopes to a system role.",
			params: {
				role: "The role to add the provided scope(s) to."
			},
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
			}
		}
	})
	async handle({ data: { role, scopes } }: { data: { role: string; scopes: string[] } }) {
		return {
			status: 200,
			data: await this.roleScopesDbRepo.addScopesToRole(role, scopes)
		};
	}

}

export default AddSystemRoleScopesHandler;
