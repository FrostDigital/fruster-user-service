import { Db, Collection } from "mongodb";
import constants from "../constants";
import RoleModel from "../models/RoleModel";
import AbstractRoleScopesRepo from "./AbstractRoleScopesRepo";
import errors from "../errors";

/**
 * RoleScopesRepo getting its data from the db.
 */
class RoleScopesDbRepo extends AbstractRoleScopesRepo {
	_collection: Collection;

	constructor(db: Db) {
		super();
		this._collection = db.collection(constants.collections.ROLE_SCOPES);
	}

	/**
	 * If nothing exists in database then we get roles from config and add them to the database.
	 *
	 * @override
	 */
	async prepareRoles(): Promise<void> {
		if ((await this.getRoles()).length === 0) {
			const roles = await super.prepareRoles() as RoleModel[];
			await this.addRoles(roles);
		}
	}

	/**
	 * Returns roles w/ scopes.
	 *
	 * @override
	 */
	async getRoles(): Promise<RoleModel[]> {
		return await this._collection.find({}).project({ _id: 0 }).toArray() as unknown as RoleModel[];
	}

	/**
	 * Returns a role w/ scopes.
	 *
	 * @override
	 */
	async getRole(role: string): Promise<RoleModel | null> {
		return await this._collection.findOne({ role }, { projection: { _id: 0 } }) as unknown as RoleModel | null;
	}

	/**
	 * Adds a role.
	 *
	 * @override
	 */
	async addRole(role: string, scopes: string[] | string = []): Promise<RoleModel | null> {
		/** Checks if role exists. If it does, just return and pretend like nothing happened*/
		if ((await this._collection.find({ role }).limit(1).count()) > 0)
			throw errors.get("fruster-user-service.SYSTEM_ROLE_ALREADY_EXISTS", role);

		const scopesToAdd = scopes instanceof Array ? scopes : [scopes];

		await this._collection.insertOne(new RoleModel(role, scopesToAdd) as any);
		return await this.getRole(role);
	}

	/**
	 * Adds an array of roles.
	 *
	 * @override
	 */
	async addRoles(roles: RoleModel[]): Promise<void> {
		await this._collection.insertMany(roles as any[]);
	}

	/**
	 * Removes a role.
	 *
	 * @override
	 */
	async removeRole(role: string): Promise<void> {
		await this._collection.deleteOne({ role });
	}

	/**
	 * Adds scope(s) to a specific role.
	 *
	 * @override
	 */
	async addScopesToRole(role: string, scopes: string[] | string): Promise<RoleModel | null> {
		const scopesToAdd = scopes instanceof Array ? scopes : [scopes];

		await this._collection.updateOne({ role }, {
			$addToSet: {
				scopes: { $each: scopesToAdd } as any
			}
		});

		return await this.getRole(role);
	}

	/**
	 * Removes scope(s) to a specific role.
	 *
	 * @override
	 */
	async removeScopesFromRole(role: string, scopes: string[] | string): Promise<RoleModel | null> {
		const scopesToRemove = scopes instanceof Array ? scopes : [scopes];

		await this._collection.updateOne({ role }, {
			$pull: { scopes: { $in: scopesToRemove } } as any
		});

		return await this.getRole(role);
	}
}

export default RoleScopesDbRepo;
