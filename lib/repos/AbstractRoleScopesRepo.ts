import RoleModel from "../models/RoleModel";
import config from "../../config";

class AbstractRoleScopesRepo {
	/**
	 * Parses `config.roles` into an array of `RoleModel`.
	 */
	async prepareRoles(): Promise<RoleModel[] | void> {
		const predefinedRoles = config.roles.split(";");
		const rolesArray: RoleModel[] = [];

		predefinedRoles.forEach((role: string) => {
			const roleName = role.substring(0, role.lastIndexOf(":"));
			const permissions = role.substring(role.lastIndexOf(":") + 1).split(",");

			rolesArray.push(new RoleModel(roleName, permissions));
		});

		return rolesArray;
	}

	/**
	 * Returns roles w/ scopes.
	 */
	async getRoles(): Promise<RoleModel[] | null> {
		return null;
	}

	/**
	 * Returns a role w/ scopes.
	 */
	async getRole(role: string): Promise<RoleModel | null> {
		return null;
	}

	/**
	 * Adds a role.
	 */
	async addRole(role?: string, scopes?: string[] | string): Promise<RoleModel | null> {
		return null;
	}

	/**
	 * Removes a role.
	 */
	async removeRole(role: string): Promise<void> {
		return null as unknown as void;
	}

	/**
	 * Adds scope(s) to a specific role.
	 */
	async addScopesToRole(role?: string, scopes?: string[] | string): Promise<RoleModel | null> {
		return null;
	}

	/**
	 * Removes scope(s) to a specific role.
	 */
	async removeScopesFromRole(role?: string, scopes?: string[] | string): Promise<RoleModel | null> {
		return null;
	}
}

export default AbstractRoleScopesRepo;
