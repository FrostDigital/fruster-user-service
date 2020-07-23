const config = require("../../config");
const uuid = require("uuid");
const Utils = require("../utils/Utils");
const RoleManager = require("../managers/RoleManager");
const errors = require("../errors");
const log = require("fruster-log");


/** Since the data can now be configured to be in either User or Profile we need to do the same checks for both. */
class AccountDataSetModel {

	/**
	 * @param {Object} json
	 * @param {Boolean=} isFilteredResult
	 */
	constructor(json, isFilteredResult) {
		if (!json || typeof json !== "object")
			throw new Error(`Expected json to be of type object but got ${typeof json} with value ${json}`).stack;

		if ("metadata" in json) {
			this.metadata = {};

			if ("created" in json.metadata)
				this.metadata.created = new Date(json.metadata.created);

			if ("updated" in json.metadata)
				this.metadata.updated = new Date(json.metadata.updated);
		}

		if (isFilteredResult)
			this._fromFilteredData(json);
		else {
			/** Sets (custom) keys specific to other projects */
			Object.keys(json).forEach(key => {
				this[key] = json[key];
			});

			this.id = json.id || uuid.v4();

			if (json.email)
				this.email = json.email.toLowerCase();

			if ("password" in json)
				this.password = json.password;

			if (config.lowerCaseName) {
				if ("firstName" in json)
					this.firstName = json.firstName || json.firstName === "" ? json.firstName.toLowerCase() : undefined;

				if ("lastName" in json)
					this.lastName = json.lastName || json.lastName === "" ? json.lastName.toLowerCase() : undefined;

				if ("middleName" in json)
					this.middleName = json.middleName ? json.middleName.toLowerCase() : undefined;
			} else {
				if ("firstName" in json)
					this.firstName = json.firstName;
				if ("lastName" in json)
					this.lastName = json.lastName;

				if ("middleName" in json)
					this.middleName = json.middleName;
			}

			if ("roles" in json) {
				this.roles = [];

				if (json.roles) {
					json.roles.forEach(role => {
						if (!this.roles.includes(role))
							this.roles.push(role);
					});
				}
			}

			if ("salt" in json)
				this.salt = json.salt;

			if ("hashDate" in json)
				//@ts-ignore
				this.hashDate = new Date(json.hashDate);

			if ("scopes" in json)
				this.scopes = null;

			if ("emailVerified" in json)
				this.emailVerified = json.emailVerified;

			if ("emailVerificationToken" in json)
				this.emailVerificationToken = json.emailVerificationToken;
		}
	}

	/**
	 * @return {Void}
	 */
	_fromFilteredData(json) {
		Object.keys(json)
			.forEach(key => {
				this[key] = json[key];
			});

		if (config.lowerCaseName) {
			if (this.firstName)
				this.firstName = json.firstName || json.firstName === "" ? json.firstName.toLowerCase() : undefined;

			if (this.lastName)
				this.lastName = json.lastName || json.lastName === "" ? json.lastName.toLowerCase() : undefined;

			if (this.middleName)
				this.middleName = json.middleName ? json.middleName.toLowerCase() : undefined;
		}

		if (this.email)
			this.email = json.email ? json.email.toLowerCase() : undefined;

		if (json.salt)
			this.salt = json.salt;

		if (this.hashDate)
			//@ts-ignore
			this.hashDate = new Date(json.hashDate);

		if (this.scopes)
			this.scopes = null;

		if (this.emailVerified)
			this.emailVerified = json.emailVerified;

		if (this.emailVerificationToken)
			this.emailVerificationToken = json.emailVerificationToken;

		if (this.roles && this.roles.length === 0)
			delete this.roles;
	}

	/**
	 * Converts to view model
	 *
	 * @param {RoleManager=} roleManager
	 */
	async toViewModel(roleManager) {
		log.debug("Converts data model to view model for", this.constructor.name, this.id);

		const viewModel = Object.assign({}, this);

		delete viewModel.password;
		delete viewModel.salt;
		delete viewModel.emailVerificationToken;
		delete viewModel.hashDate;

		// @ts-ignore
		delete viewModel._id;

		if (viewModel.roles && roleManager)
			viewModel.scopes = await roleManager.getScopesForRoles(viewModel.roles);

		if (config.lowerCaseName) {
			if (viewModel.firstName)
				viewModel.firstName = Utils.toTitleCase(viewModel.firstName);
			if (viewModel.lastName)
				viewModel.lastName = Utils.toTitleCase(viewModel.lastName);
			if (viewModel.middleName)
				viewModel.middleName = viewModel.middleName ? Utils.toTitleCase(viewModel.middleName) : undefined;
		}

		return viewModel;
	}

}

module.exports = AccountDataSetModel;
