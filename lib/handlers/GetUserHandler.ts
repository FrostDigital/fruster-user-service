import { injectable, inject, subscribe } from "@fruster/decorators";
import log from "@fruster/log";
import config from "../../config";
import UserRepo from "../repos/UserRepo";
import deprecatedErrors from "../deprecatedErrors";
import UserModel from "../models/UserModel";
import RoleManager from "../managers/RoleManager";
import constants from "../constants";
import docs from "../docs";


@injectable()
class GetUserHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private roleManager!: RoleManager;

	/**
	 * NOTE: This endpoint is deprecated!
	 *
	 * Internal handler for manager calls to get users
	 * and filter by query.
	 *
	 * Note that manager is by default configured to block attempts to get ALL users
	 * (i.e. by sending an empty query). This can be enabled by changing config `ALLOW_GET_ALL`.
	 */
	@subscribe({
		subject: constants.endpoints.service.GET_USER,
		deprecated: docs.deprecated.GET_USER,
		responseSchema: constants.schemas.response.USER_LIST_RESPONSE,
		docs: {
			description: "Gets users by query. Response has status code `200` if successful.",
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened.",
				"user-service.400.13": "Invalid json. Query includes salt or password or query is empty (and config.allowGetAll is false)"
			}
		}
	})
	async handle({ data }: { data: Record<string, any> }) {
		this._validateQuery(data);

		let users: UserModel[] = [];

		try {
			[users] = await this.userRepo.getUsersByQuery({ query: data });
		} catch (err) {
			// Fail quietly by design - an invalid mongo query should
			// result in empty result
			log.warn(`Failed getting users: ${JSON.stringify(err, null, 4)}`);
		}

		return {
			status: 200,
			data: await Promise.all(users.map(u => new UserModel(u).toViewModel(this.roleManager)))
		};
	}

	/**
	 * HTTP handler for getting users. Is only exposed for admins.
	 * Will use HTTP query as mongo query
	 *
	 * Can do pagination if query param `start` is set. If so
	 * results will start from that entry with default page size
	 * of 50. Page size can be set by setting query param `limit`.
	 */
	@subscribe({
		subject: constants.endpoints.http.admin.GET_USERS,
		responseSchema: constants.schemas.response.USER_LIST_RESPONSE,
		permissions: [constants.permissions.ADMIN_ANY],
		mustBeLoggedIn: true,
		docs: {
			description: "Gets users. Response has status code `200` if successful. Note that any query params will be used as a mongo query.",
			query: {
				limit: "number of results",
				start: "index to start results from",
				searchField: "field to search in, supports nested fields with dot notation",
				searchValue: "value to search for - a regex, for example .*alice.* - performs a case insensitive search",
			},
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}
	})
	async handleHttp({ query: { start, limit, ...query } }: { query: Record<string, any> }) {
		if (start)
			// @ts-ignore
			start = Number.parseInt(start || 0);

		if (limit)
			// @ts-ignore
			limit = Number.parseInt(limit || 50);

		if (query.searchField && query.searchValue) {
			query[query.searchField] = { $regex: query.searchValue, $options: "i" };
		}

		delete query.searchField;
		delete query.searchValue;

		// @ts-ignore
		let [users] = await this.userRepo.getUsersByQuery({ query, start, limit });

		return {
			status: 200,
			data: await Promise.all(users.map((u: UserModel) => new UserModel(u).toViewModel(this.roleManager)))
		};
	}

	/**
	 * Validates inputted query
	 */
	_validateQuery(query: Record<string, any>): void {
		if (!query || (Object.keys(query).length === 0 && !config.allowGetAll) || query.password || query.salt) {
			throw deprecatedErrors.invalidJson();
		}
	}

}

export default GetUserHandler;
