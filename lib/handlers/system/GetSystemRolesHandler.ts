import { injectable, inject, subscribe } from "@fruster/decorators";
import RoleModel from "../../models/RoleModel";
import RoleScopesDbRepo from "../../repos/RoleScopesDbRepo";
import log from "@fruster/log";
import constants from "../../constants";


/**
 * NOTE: Only instantiated (and thus only registered via @subscribe) when
 * config.useDbRolesAndScopes is enabled -- see fruster-user-service.ts.
 */
@injectable()
class GetSystemRolesHandler {

	@inject()
	private roleScopesDbRepo!: RoleScopesDbRepo;

	@subscribe({
		subject: constants.endpoints.http.admin.GET_SYSTEM_ROLES,
		permissions: [constants.permissions.GET_SYSTEM_ROLES],
		responseSchema: constants.schemas.response.ROLE_MODEL_LIST_RESPONSE,
		docs: {
			description: "Gets all system roles.",
			query: {
				format: `Output format. Supports "config" to output roles as a config string.`
			},
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
			}
		}
	})
	async handle(req: { query?: Record<string, any> }) {
		req.query = req.query || {};

		let roles: RoleModel[] | string = await this.roleScopesDbRepo.getRoles();

		const format = req.query.format;

		if (format)
			switch (format) {
				case "config":
					roles = this._formatAsConfig(roles as RoleModel[]);
					break;
				default:
					log.error(`GetSystemRolesHandler: Invalid format; ${format}`);
					break;
			}

		return {
			status: 200,
			data: roles
		};
	}

	/**
	 * Formats roles as a string that can be used as the config.ROLE_SCOPES config.
	 */
	_formatAsConfig(roles: RoleModel[]): string {
		let output = ``;

		roles.forEach(roleObj => {
			let roleString = `${roleObj.role}:`;

			roleObj.scopes.forEach((scope, i) => {
				roleString += scope;

				if (i < roleObj.scopes.length - 1)
					roleString += ",";
			});

			roleString += ";";

			output += roleString;
		});

		return output;
	}

}

export default GetSystemRolesHandler;
