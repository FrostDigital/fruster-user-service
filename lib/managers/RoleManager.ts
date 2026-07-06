import AbstractRoleScopesRepo from "../repos/AbstractRoleScopesRepo";
import RoleScopesConfigRepo from "../repos/RoleScopesConfigRepo";

class RoleManager {
	_roleScopesRepo: AbstractRoleScopesRepo;

	constructor(roleScopesRepo: AbstractRoleScopesRepo = new RoleScopesConfigRepo()) {
		this._roleScopesRepo = roleScopesRepo;
	}

	async getRoles(): Promise<Record<string, string[]>> {
		const roles = await this._roleScopesRepo.getRoles();
		const rolesObject: Record<string, string[]> = {};

		(roles || []).forEach(roleObj => {
			rolesObject[roleObj.role] = roleObj.scopes;
		});

		return rolesObject;
	}

	async validateRoles(roles: string[]): Promise<string[]> {
		if (!roles || roles.length === 0)
			return [];

		const invalidRoles: string[] = [];
		const rolesObject = await this.getRoles();

		roles.forEach(role => {
			if (!rolesObject[role]) {
				invalidRoles.push(role);
			}
		});

		return invalidRoles;
	}

	async getScopesForRoles(roles: string[]): Promise<string[]> {
		const scopes: string[] = [];
		const rolesWithPermissions = await this.getRoles();

		roles.forEach(role => {
			if (rolesWithPermissions[role]) {
				rolesWithPermissions[role].forEach(permission => {
					if (!scopes.includes(permission)) {
						scopes.push(permission);
					}
				});
			}
		});

		return scopes;
	}
}

export default RoleManager;
