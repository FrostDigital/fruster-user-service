import { v4 as uuidv4 } from "uuid";
import AbstractRoleScopesRepo from "./AbstractRoleScopesRepo";
import RoleModel from "../models/RoleModel";

/**
 * RoleScopesRepo getting its data from the config.
 */
class RoleScopesConfigRepo extends AbstractRoleScopesRepo {
	_rolesArray: RoleModel[];
	id: string;

	constructor() {
		super();
		this._rolesArray = [];
		this.id = uuidv4();
	}

	/**
	 * Reads roles from config and stores them in memory.
	 *
	 * @override
	 */
	async prepareRoles(): Promise<void> {
		if (this._rolesArray.length === 0) {
			const rolesArray = await super.prepareRoles() as RoleModel[];
			this._rolesArray = rolesArray;
		}
	}

	/**
	 * Returns roles w/ scopes.
	 *
	 * @override
	 */
	async getRoles(): Promise<RoleModel[]> {
		return this._rolesArray;
	}

	/**
	 * Returns a role w/ scopes.
	 *
	 * @override
	 */
	async getRole(role: string): Promise<RoleModel | undefined> {
		return this._rolesArray.find(roleModel => roleModel.role === role);
	}

	/**
	 * Adds a role.
	 *
	 * @override
	 */
	async addRole(): Promise<RoleModel> {
		throw "Cannot add roles to config";
	}

	/**
	 * Removes a role.
	 *
	 * @override
	 */
	async removeRole(): Promise<void> {
		throw "Cannot remove roles from config";
	}

	/**
	 * Adds scope(s) to a specific role.
	 *
	 * @override
	 */
	async addScopesToRole(): Promise<RoleModel> {
		throw "Cannot add scopes to role in config";
	}

	/**
	 * Removes scope(s) to a specific role.
	 *
	 * @override
	 */
	async removeScopesFromRole(): Promise<RoleModel> {
		throw "Cannot remove scopes from role in config";
	}
}

export default RoleScopesConfigRepo;
