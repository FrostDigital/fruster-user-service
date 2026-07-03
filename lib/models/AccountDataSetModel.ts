import config from "../../config";
import { v4 as uuidv4 } from "uuid";
import Utils from "../utils/Utils";
import log from "@fruster/log";

// Forward-reference to avoid circular deps — RoleManager is only used as a parameter type
type RoleManagerLike = {
	getScopesForRoles(roles: string[]): Promise<string[]>;
};

/** Since the data can now be configured to be in either User or Profile we need to do the same checks for both. */
class AccountDataSetModel {
	id?: string;
	email?: string;
	password?: string;
	salt?: string;
	hashDate?: Date;
	firstName?: string;
	lastName?: string;
	middleName?: string;
	roles?: string[];
	scopes?: string[] | null;
	emailVerified?: boolean;
	emailVerificationToken?: string;
	metadata?: { created?: Date; updated?: Date };
	[key: string]: unknown;

	constructor(json: Record<string, unknown>, isFilteredResult?: boolean) {
		if (!json || typeof json !== "object")
			throw new Error(`Expected json to be of type object but got ${typeof json} with value ${json}`);

		if ("metadata" in json) {
			this.metadata = {};
			const meta = json.metadata as Record<string, unknown>;

			if ("created" in meta) this.metadata.created = new Date(meta.created as string);

			if ("updated" in meta) this.metadata.updated = new Date(meta.updated as string);
		}

		if (isFilteredResult)
			this._fromFilteredData(json);
		else {
			/** Sets (custom) keys specific to other projects */
			Object.keys(json).forEach(key => {
				this[key] = json[key];
			});

			this.id = (json.id as string) || uuidv4();

			if (json.email)
				this.email = (json.email as string).toLowerCase();

			if ("password" in json)
				this.password = json.password as string;

			if (config.lowerCaseName) {
				if ("firstName" in json)
					this.firstName = json.firstName || json.firstName === "" ? (json.firstName as string).toLowerCase() : undefined;

				if ("lastName" in json)
					this.lastName = json.lastName || json.lastName === "" ? (json.lastName as string).toLowerCase() : undefined;

				if ("middleName" in json)
					this.middleName = json.middleName ? (json.middleName as string).toLowerCase() : undefined;
			} else {
				if ("firstName" in json)
					this.firstName = json.firstName as string;
				if ("lastName" in json)
					this.lastName = json.lastName as string;

				if ("middleName" in json)
					this.middleName = json.middleName as string;
			}

			if ("roles" in json) {
				this.roles = [];

				if (json.roles) {
					(json.roles as string[]).forEach(role => {
						if (!this.roles!.includes(role))
							this.roles!.push(role);
					});
				}
			}

			if ("salt" in json)
				this.salt = json.salt as string;

			if ("hashDate" in json)
				this.hashDate = new Date(json.hashDate as string);

			if ("scopes" in json)
				this.scopes = null;

			if ("emailVerified" in json)
				this.emailVerified = json.emailVerified as boolean;

			if ("emailVerificationToken" in json)
				this.emailVerificationToken = json.emailVerificationToken as string;
		}
	}

	_fromFilteredData(json: Record<string, unknown>): void {
		Object.keys(json)
			.forEach(key => {
				this[key] = json[key];
			});

		if (config.lowerCaseName) {
			if (this.firstName)
				this.firstName = json.firstName || json.firstName === "" ? (json.firstName as string).toLowerCase() : undefined;

			if (this.lastName)
				this.lastName = json.lastName || json.lastName === "" ? (json.lastName as string).toLowerCase() : undefined;

			if (this.middleName)
				this.middleName = json.middleName ? (json.middleName as string).toLowerCase() : undefined;
		}

		if (this.email)
			this.email = json.email ? (json.email as string).toLowerCase() : undefined;

		if (json.salt)
			this.salt = json.salt as string;

		if (this.hashDate)
			this.hashDate = new Date(json.hashDate as string);

		if (this.scopes)
			this.scopes = null;

		if (this.emailVerified)
			this.emailVerified = json.emailVerified as boolean;

		if (this.emailVerificationToken)
			this.emailVerificationToken = json.emailVerificationToken as string;

		if (this.roles && this.roles.length === 0)
			delete this.roles;
	}

	/**
	 * Converts to view model
	 */
	async toViewModel(roleManager?: RoleManagerLike): Promise<Record<string, unknown>> {
		log.debug("Converts data model to view model for", this.constructor.name, this.id);

		const viewModel: Record<string, unknown> = { ...this };

		config.privateProperties.split("|").forEach(property => {
			delete viewModel[property];
		});

		delete viewModel._id;

		if (viewModel.roles && roleManager)
			viewModel.scopes = await roleManager.getScopesForRoles(viewModel.roles as string[]);

		if (config.lowerCaseName) {
			if (viewModel.firstName)
				viewModel.firstName = Utils.toTitleCase(viewModel.firstName as string);
			if (viewModel.lastName)
				viewModel.lastName = Utils.toTitleCase(viewModel.lastName as string);
			if (viewModel.middleName)
				viewModel.middleName = viewModel.middleName ? Utils.toTitleCase(viewModel.middleName as string) : undefined;
		}

		return viewModel;
	}
}

export default AccountDataSetModel;
