import UserModel from "../models/UserModel";
import { Db, Collection } from "mongodb";
import errors from "../errors";
import log from "@fruster/log";
import constants from "../constants";
import config from "../../config";

class UserRepo {
	_collection: Collection;

	constructor(db: Db) {
		this._collection = db.collection(constants.collections.USERS);
	}

	/**
	 * Gets users by given query. Can optionally pass in additional
	 * object for pagination.
	 */
	async getUsersByQuery({
		query = {}, start = 0, limit = 0, filter = {},
		sort = {}, expand = false, caseInsensitiveSort = false, hasExpandSort = false, count = false
	}: {
		query?: Record<string, unknown>;
		start?: number;
		limit?: number;
		filter?: Record<string, unknown>;
		sort?: Record<string, unknown>;
		expand?: boolean;
		caseInsensitiveSort?: boolean;
		hasExpandSort?: boolean;
		count?: boolean;
	}): Promise<[UserModel[], number]> {
		const startTime = Date.now();
		const dbFilter = Object.assign(filter, {});

		let usersFromDatabase: any[] | undefined;
		let totalCount: number | undefined;

		if (count)
			totalCount = await this._findCount(query);
		else if (expand || caseInsensitiveSort || hasExpandSort)
			[usersFromDatabase, totalCount] = await this._aggregateResult(query, start, limit, dbFilter, sort, expand, caseInsensitiveSort);
		else
			[usersFromDatabase, totalCount] = await this._findResult(query, start, limit, dbFilter, sort);

		if (!usersFromDatabase)
			usersFromDatabase = [];

		if (!totalCount)
			totalCount = usersFromDatabase.length;

		const queryDuration = Date.now() - startTime;

		if (queryDuration >= config.slowQueryThresholdMs)
			log.warn(`SLOW QUERY DETECTED: Duration ${queryDuration}ms, query ${JSON.stringify(query)}, filter ${JSON.stringify(dbFilter)}`);

		return [usersFromDatabase.map(u => new UserModel(u, Object.keys(filter).length > 0)), totalCount];
	}

	/**
	 * if we want to expand user with profile we need to aggregate results together.
	 */
	async _aggregateResult(
		query: Record<string, unknown> = {},
		start = 0,
		limit = 0,
		filter: Record<string, unknown> = {},
		sort: Record<string, unknown> = {},
		doExpand?: boolean,
		caseInsensitiveSort?: boolean
	): Promise<[any[], number | undefined]> {
		const aggregation: Record<string, unknown>[] = doExpand &&
			!(config.userFields.includes(constants.dataset.ALL_FIELDS)
				&& config.profileFields.includes(constants.dataset.ALL_FIELDS)
			) ? this._getExpandAggregation(query) : [{ $match: query }];

		const hasSort = Object.keys(sort).length > 0;
		const hasFilter = Object.keys(filter).length > 0;

		let $project: Record<string, unknown>;

		if (hasFilter) {
			$project = {};
			/** Converts filter w/ { key: 1 } to { key : "$key" } $project*/
			Object.keys(filter).forEach(filterKey => $project[filterKey] = `$${filterKey}`);
		} else
			/** Sets all document's fields as `user` */
			$project = { user: "$$ROOT" };

		let sortObj: Record<string, unknown> = {};

		if (hasSort) {
			/**
			 * Goes through all inputted keys to sort on and projects a lowercased version of that key's value.
			 * Then we sort on that lowercased value in the order that was inputted.
			 */
			Object.keys(sort).forEach(sortKey => {
				if (caseInsensitiveSort) {
					$project["__caseInsensitiveSortVar" + sortKey] = { "$toLower": `$${sortKey}` };
					sortObj["__caseInsensitiveSortVar" + sortKey] = sort[sortKey];
				} else {
					$project["__caseSensitiveSortVar" + sortKey] = `$${sortKey}`;
					sortObj["__caseSensitiveSortVar" + sortKey] = sort[sortKey];
				}
			});
		}

		aggregation.push({ $project });

		if (hasSort)
			aggregation.push({ $sort: sortObj });

		aggregation.push({ $skip: start });

		if (limit > 0)
			aggregation.push({ $limit: limit });

		let usersFromDatabase: any[] = await this._collection.aggregate(aggregation).toArray();

		/** If we have a sort we need to readjust results to not have any of the caseinsensitive sorting data */
		if (!hasFilter)
			usersFromDatabase = usersFromDatabase.map(u => u.user);
		else if (caseInsensitiveSort)
			usersFromDatabase = usersFromDatabase.map(u => {
				Object.keys(sortObj).forEach(tempSortKey => {
					delete u[tempSortKey.split(".")[0]]; // if using something like "user.something.firstName" it will be an object in the output
				});

				return u;
			});

		let totalCount;

		if (limit) {
			const countQuery = doExpand ? this._getExpandAggregation(query) : [{ $match: query }];

			const countAggregationQuery = countQuery
				.concat([{ $group: { _id: 1, count: { $sum: 1 } } }]);

			const dbCountResult = await this._collection.aggregate(countAggregationQuery).toArray();

			if (dbCountResult.length)
				totalCount = dbCountResult[0].count;
		}

		return [usersFromDatabase, totalCount];
	}

	/**
	 * Returns an aggregation cursor for combining user and profiles into one, querying on both.
	 */
	_getExpandAggregation(query: Record<string, unknown>): Record<string, unknown>[] {
		return [
			{ $lookup: { from: "profiles", localField: "id", foreignField: "id", as: "profile" } },
			{ $match: query },
			{ $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } }
		];
	}

	/**
	 * If we are just getting users we can use the normal finds.
	 */
	async _findResult(
		query: Record<string, unknown> = {},
		start = 0,
		limit = 0,
		filter: Record<string, unknown> = {},
		sort: Record<string, unknown> = {}
	): Promise<[any[], number | undefined]> {
		const mongoQueryOperation = this._collection
			.find(query)
			.project({ ...filter, _id: 0 })
			.sort(sort as any)
			.collation({ locale: config.locale, numericOrdering: true });

		if (start) {
			mongoQueryOperation.skip(start);
		}
		if (limit) {
			mongoQueryOperation.limit(limit);
		}

		const usersFromDatabase = await mongoQueryOperation.toArray();
		let totalCount;

		if (limit)
			totalCount = await this._collection.countDocuments(query);

		return [usersFromDatabase, totalCount];
	}

	/**
	 * If we are just getting users count we can use the normal finds for count.
	 */
	async _findCount(query: Record<string, unknown> = {}): Promise<number> {
		const mongoQueryOperation = this._collection
			.find(query);

		return await mongoQueryOperation.count();
	}

	/**
	 * Gets user by given query.
	 */
	async getUserByQuery(query: Record<string, unknown> = {}): Promise<UserModel | null> {
		const userFromDatabase = await this._collection.findOne(query, { projection: { _id: 0 } });

		return userFromDatabase ? new UserModel(userFromDatabase as Record<string, unknown>) : null;
	}

	/**
	 * Gets user by given aggregate.
	 */
	async getUserByAggregate(aggregate: Record<string, unknown>[]): Promise<UserModel[]> {
		const users = await this._collection.aggregate(aggregate).toArray();
		return users.map(user => new UserModel(user as Record<string, unknown>));
	}

	/**
	 * Get records by aggregate
	 */
	async getByAggregate(aggregate: Record<string, unknown>[]): Promise<any[]> {
		return await this._collection.aggregate(aggregate).toArray();
	}

	/**
	 * Gets user by given query.
	 */
	async getUsersByQueryInternal(query: Record<string, unknown> = {}): Promise<UserModel[]> {
		const usersFromDatabase = await this._collection.find(query).project({ _id: 0 }).toArray();

		return usersFromDatabase.map(u => new UserModel(u as Record<string, unknown>));
	}

	/**
	 * Gets user by id.
	 */
	async getById(userId: string): Promise<UserModel | null> {
		return await this.getUserByQuery({ id: userId });
	}

	/**
	 * Saves user to database.
	 */
	async saveUser(user: UserModel): Promise<UserModel> {
		const now = new Date();

		user.metadata = {};
		user.metadata.created = now;
		user.metadata.updated = now;

		const result = await this._collection.insertOne(user as any);

		if (result.acknowledged) {
			const createdUser = await this._collection.findOne({ _id: result.insertedId });
			return new UserModel(createdUser as Record<string, unknown>);
		} else {
			throw new Error("Insert failed");
		}
	}

	/**
	 * Updates a user.
	 */
	async updateUser(id: string, setData: Record<string, unknown>, unsetData?: Record<string, unknown>): Promise<UserModel | null> {
		if (setData.metadata)
			delete setData.metadata;

		setData["metadata.updated"] = new Date();

		const updateData: Record<string, unknown> = { $set: setData };

		if (unsetData)
			updateData.$unset = unsetData;

		await this._collection.updateOne({ id }, updateData as any);

		return await this.getById(id);
	}

	/**
	 * Adds a set of roles to a user.
	 */
	async addRolesForUser(id: string, rolesToAdd: string[]): Promise<UserModel | null> {
		await this._collection.updateOne(
			{ id }, {
			$set: { "metadata.updated": new Date() },
			$push: { roles: { $each: rolesToAdd } } as any
		});

		return await this.getById(id);
	}

	/**
	 * Removes a set of roles from a user.
	 */
	async removeRolesForUser(id: string, rolesToRemove: string[]): Promise<UserModel | null> {
		await this._collection.updateOne(
			{ id }, {
			$set: { "metadata.updated": new Date() },
			$pull: { roles: { $in: rolesToRemove } } as any
		});

		return await this.getById(id);
	}

	/**
	 * Deletes a user.
	 */
	async deleteUser(userId: string): Promise<void> {
		const result = await this._collection.deleteOne({ id: userId });

		if (result.deletedCount > 0)
			return;
		else
			throw errors.get("fruster-user-service.NOT_FOUND", "user not found");
	}

	/**
	 * Deletes any users found with query
	 */
	async deleteUsersByQuery(query: Record<string, unknown>): Promise<string[]> {
		const usersToDelete = await this._collection.aggregate(this._getExpandAggregation(query)).toArray();
		const userIds = usersToDelete.map(u => u.id);

		await this._collection.deleteMany({ id: { $in: userIds } });
		return userIds;
	}
}

export default UserRepo;
