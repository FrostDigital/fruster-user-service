import { injectable, inject, subscribe } from "@fruster/decorators";
import UserRepo from "../repos/UserRepo";
import RoleManager from "../managers/RoleManager";
import UserModel from "../models/UserModel";
import log from "@fruster/log";
import deprecatedErrors from "../deprecatedErrors";
import config from "../../config";
import ProfileManager from "../managers/ProfileManager";
import constants from "../constants";


@injectable()
class GetUsersByQueryHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private roleManager!: RoleManager;

	@inject()
	private profileManager!: ProfileManager;

	@subscribe({
		subject: constants.endpoints.service.GET_USERS_BY_QUERY,
		requestSchema: constants.schemas.request.GET_USERS_BY_QUERY,
		responseSchema: constants.schemas.response.GET_USERS_BY_QUERY_RESPONSE,
		docs: {
			description: `Gets users by query.  **Note:** Return data may vary depending on the configuration. Configured user fields: **${config.userFields.join(",")}** (Will always return id,email,password,roles,scopes) \n\n Can be expanded to return both user and profile data using \`expand: "profile"\` if configured to split the data. If expand is used; the query can be used to query profile fields as well: \`{ "profile.firstName": "Bob" }\`. With expand; the data is returned \`{...userData, profile: {...profileData}}\`. Can fetch only user count without users, using \`count: true\`. if count is used returns totalCount with empty users array`,
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened.",
				"user-service.400.13": "Invalid json. Query includes salt or password or query is empty (and config.allowGetAll is false)"
			}
		}
	})
	async handle({ data: { start, limit, filter, sort, query, expand, caseInsensitiveSort, count } }: { data: Record<string, any> }) {
		this._validateQuery(query);

		if (start) start = Number.parseInt(start || 0);

		if (limit) limit = Number.parseInt(limit || 50);

		let sortObject: Record<string, unknown> = {};
		let hasExpandSort = false;

		if (sort)
			[sortObject, hasExpandSort] = this._getSortObj(sort, expand);

		let users: UserModel[] = [];

		let totalCount = 0;

		try {
			[users, totalCount] = await this.userRepo.getUsersByQuery({
				query, start, limit, filter, sort: sortObject, expand, caseInsensitiveSort, hasExpandSort, count
			});
		} catch (err) {
			// Fail quietly by design - an invalid mongo query should
			// result in empty result
			log.warn(`Failed getting users: ${JSON.stringify(err, null, 4)}`);
		}

		return {
			status: 200,
			data: {
				totalCount,
				users: await Promise.all(users.map(u => new UserModel(u, !!filter).toViewModel(this.roleManager)))
			}
		};
	}

	/**
	 * Validates inputted query
	 */
	_validateQuery(query: Record<string, any>): void {
		if (!query || (Object.keys(query).length === 0 && !config.allowGetAll) || query.password || query.salt)
			throw deprecatedErrors.invalidJson();
	}

	_getSortObj(sort: Record<string, unknown>, expand: boolean): [Record<string, unknown>, boolean] {
		let sortObject: Record<string, unknown> = {};
		let hasExpandSort = false;

		const [user, profile] = this.profileManager.splitUserFields(sort);

		if (Object.keys(profile).length || expand) {
			sortObject = { ...user };

			for (let [field, order] of Object.entries(profile)) {
				if (!field.includes("profile."))
					sortObject[`profile.${field}`] = order;
				else
					sortObject[field] = order;
			}

			hasExpandSort = true;
		} else {
			sortObject = sort;
		}

		return [sortObject, hasExpandSort];
	}

}

export default GetUsersByQueryHandler;
