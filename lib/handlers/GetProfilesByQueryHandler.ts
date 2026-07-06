import { injectable, inject, subscribe } from "@fruster/decorators";
import RoleManager from "../managers/RoleManager";
import log from "@fruster/log";
import deprecatedErrors from "../deprecatedErrors";
import config from "../../config";
import ProfileModel from "../models/ProfileModel";
import ProfileManager from "../managers/ProfileManager";
import constants from "../constants";


/**
 * NOTE: Only instantiated (and thus only registered via @subscribe) when
 * profile-splitting is configured -- see the conditional in
 * fruster-user-service.ts (config.profileFields / config.userFields).
 */
@injectable()
class GetProfilesByQueryHandler {

	@inject()
	private roleManager!: RoleManager;

	@inject()
	private profileManager!: ProfileManager;

	@subscribe({
		subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
		requestSchema: constants.schemas.request.GET_PROFILES_BY_QUERY,
		responseSchema: constants.schemas.response.GET_PROFILES_BY_QUERY,
		docs: {
			description: `Gets profiles by query. **Note:** Return data may vary depending on the configuration. Configured profile fields: **${config.profileFields.join(",")}** ${config.profileFields.includes(constants.dataset.ALL_FIELDS) ? `(Everything except the fields configured for [user](#user-service.get-users-by-query))` : ""}`,
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened.",
				"user-service.400.13": "Invalid json. Query is empty and config.allowGetAll is false"
			}
		}
	})
	async handle({ data: { start, limit, filter, sort, query, caseInsensitiveSort } }: { data: Record<string, any> }) {
		this._validateQuery(query);

		if (start) start = Number.parseInt(start || 0);

		if (limit) limit = Number.parseInt(limit || 50);

		let profiles: ProfileModel[] = [];

		let totalCount = 0;

		try {
			[profiles, totalCount] = await this.profileManager.getProfilesByQuery(query, start, limit, filter, sort, caseInsensitiveSort) as [ProfileModel[], number];
		} catch (err) {
			// Fail quietly by design - an invalid mongo query should
			// result in empty result
			log.warn(`Failed getting profiles: ${JSON.stringify(err, null, 4)}`);
		}

		return {
			status: 200,
			data: {
				totalCount,
				profiles: await Promise.all(profiles.map(p => new ProfileModel(p, !!filter).toViewModel(this.roleManager)))
			}
		};
	}

	/**
	 * Validates inputted query
	 */
	_validateQuery(query: Record<string, any>): void {
		if (!query || (Object.keys(query).length === 0 && !config.allowGetAll))
			throw deprecatedErrors.invalidJson();
	}

}

export default GetProfilesByQueryHandler;
