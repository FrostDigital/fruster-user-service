const RoleModel = require("../../models/RoleModel");
const RoleScopesDbRepo = require("../../repos/RoleScopesDbRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const log = require("fruster-log");


class GetSystemRolesHandler {

	/**
	 * @param {RoleScopesDbRepo} roleScopesDbRepo
	 */
	constructor(roleScopesDbRepo) {
		this._repo = roleScopesDbRepo;
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handle(req) {
		req.query = req.query || {};

		/** @type {RoleModel[]|String} */
		let roles = await this._repo.getRoles();

		const format = req.query.format;

		if (format)
			switch (format) {
				case "config":
					roles = this._formatAsConfig(roles);
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
	 *
	 * @param {Array<RoleModel>} roles
	 *
	 * @return {String}
	 */
	_formatAsConfig(roles) {
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

module.exports = GetSystemRolesHandler;
