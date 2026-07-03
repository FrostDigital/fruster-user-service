import { injectable, inject, subscribe } from "@fruster/decorators";
import RoleManager from "../managers/RoleManager";
import constants from "../constants";


@injectable()
class GetScopesForRolesHandler {

	@inject()
	private roleManager!: RoleManager;

	@subscribe({
		subject: constants.endpoints.service.GET_SCOPES_FOR_ROLES,
		requestSchema: constants.schemas.request.GET_SCOPES_FOR_ROLES,
		responseSchema: constants.schemas.response.STRING_ARRAY_RESPONSE,
		docs: {
			description: "Gets all scopes for specified roles in a flat array. E.g. input ['admin', 'user', 'super-admin'] would return  ['*', 'admin.*', 'profile.get']. Response has status code` 20`0 if successful.",
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}
	})
	async handle(req: { data: string[] }) {
		const roles = req.data;
		const scopesForRoles = await this.roleManager.getScopesForRoles(roles);

		return {
			status: 200,
			data: scopesForRoles
		};
	}

}

export default GetScopesForRolesHandler;
