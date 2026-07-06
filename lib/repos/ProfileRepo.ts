import { Db, Collection } from "mongodb";
import constants from "../constants";
import ProfileModel from "../models/ProfileModel";

class ProfileRepo {
	_collection: Collection;

	constructor(db: Db) {
		this._collection = db.collection(constants.collections.PROFILES);
	}

	/**
	 * Gets profiles by given query. Can optionally pass in additional
	 * object for pagination.
	 */
	async getProfilesByQuery(
		query: Record<string, unknown> = {},
		start = 0,
		limit = 0,
		filter: Record<string, unknown> = {},
		sort: Record<string, unknown> = {},
		caseInsensitiveSort = false
	): Promise<[ProfileModel[] | unknown[], number | undefined]> {
		if (caseInsensitiveSort)
			return this._getProfilesByAggregationQuery({ query, start, limit, filter, sort, caseInsensitiveSort }) as any;
		else
			return this._getProfilesByFindQuery({ query, start, limit, filter, sort, caseInsensitiveSort }) as any;
	}

	async _getProfilesByFindQuery({
		query = {}, start = 0, limit = 0, filter = {}, sort = {}
	}: {
		query?: Record<string, unknown>;
		start?: number;
		limit?: number;
		filter?: Record<string, unknown>;
		sort?: Record<string, unknown>;
		caseInsensitiveSort?: boolean;
	}): Promise<[ProfileModel[], number]> {
		const dbFilter = Object.assign(filter, { _id: 0 });

		const mongoQueryOperation = this._collection
			.find(query)
			.project(dbFilter)
			.skip(start || 0)
			.sort(sort as any);

		if (limit > 0) {
			mongoQueryOperation.limit(limit);
		}

		const profilesFromDatabase = await mongoQueryOperation.toArray();

		let totalCount;

		if (limit) {
			totalCount = await this._collection.countDocuments(query);
		} else {
			totalCount = profilesFromDatabase.length;
		}

		return [profilesFromDatabase.map(p => new ProfileModel(p as Record<string, unknown>, !!filter)), totalCount];
	}

	async _getProfilesByAggregationQuery({
		query = {}, start = 0, limit = 0, filter = {}, sort = {}, caseInsensitiveSort = false
	}: {
		query?: Record<string, unknown>;
		start?: number;
		limit?: number;
		filter?: Record<string, unknown>;
		sort?: Record<string, unknown>;
		caseInsensitiveSort?: boolean;
	}): Promise<[unknown[], number | undefined]> {
		const aggregation: Record<string, unknown>[] = [{ $match: query }];

		const hasSort = Object.keys(sort).length > 0;
		const hasFilter = Object.keys(filter).length > 0;

		let $project: Record<string, unknown>;

		if (hasFilter) {
			$project = {};
			/** Converts filter w/ { key: 1 } to { key : "$key" } $project*/
			Object.keys(filter).forEach(filterKey => $project[filterKey] = `$${filterKey}`);
		} else
			/** Sets all document's fields as `profile` */
			$project = { profile: "$$ROOT" };

		let sortObj: Record<string, unknown> = {};

		if (hasSort) {
			/**
			 * Goes through all inputted keys to sort on and projects a lowercased version of that key's value.
			 * Then we sort on that lowercased value in the order that was inputted.
			 */
			if (caseInsensitiveSort) {
				Object.keys(sort).forEach(sortKey => {
					$project["__caseInsensitiveSortVar" + sortKey] = { "$toLower": `$${sortKey}` };
					sortObj["__caseInsensitiveSortVar" + sortKey] = sort[sortKey];
				});
			} else
				sortObj = sort;
		}

		aggregation.push({ $project });

		if (hasSort)
			aggregation.push({ $sort: sortObj });

		aggregation.push({ $skip: start });

		if (limit > 0) {
			aggregation.push({ $limit: limit });
		}

		let profilesFromDatabase: any[] = await this._collection.aggregate(aggregation).toArray();

		/** If we have a sort we need to readjust results to not have any of the caseinsensitive sorting data */
		if (!hasFilter)
			profilesFromDatabase = profilesFromDatabase.map(p => p.profile);
		else if (caseInsensitiveSort)
			profilesFromDatabase = profilesFromDatabase.map(p => {
				Object.keys(sortObj).forEach(tempSortKey => {
					delete p[tempSortKey.split(".")[0]]; // if using something like "profile.something.firstName" it will be an object in the output
				});

				return p;
			});

		let totalCount;

		if (limit) {
			const countQuery: Record<string, unknown>[] = [{ $match: query }];

			const countAggregationQuery = countQuery
				.concat([{ $group: { _id: 1, count: { $sum: 1 } } }]);

			const dbCountResult = await this._collection.aggregate(countAggregationQuery).toArray();

			if (dbCountResult.length)
				totalCount = dbCountResult[0].count;
		}

		return [profilesFromDatabase, totalCount];
	}

	/**
	 * Gets profile by given query.
	 */
	async getProfileByQuery(query: Record<string, unknown> = {}): Promise<ProfileModel | null> {
		const profilesFromDatabase = await this._collection
			.findOne(query, { _id: 0 } as any);

		return profilesFromDatabase ? profilesFromDatabase as unknown as ProfileModel : null;
	}

	/**
	 * Saves profile to database.
	 */
	async saveProfile(profile: ProfileModel): Promise<ProfileModel | null> {
		const now = new Date();

		profile.metadata = {};
		profile.metadata.created = now;
		profile.metadata.updated = now;

		const createdProfile = await this._collection.insertOne(profile as any);
		return createdProfile.insertedId ? profile : null;
	}

	/**
	 * Updates a profile.
	 */
	async updateProfile(id: string, setData: Record<string, unknown>, unsetData?: Record<string, unknown>): Promise<ProfileModel | null | undefined> {
		if (setData.metadata)
			delete setData.metadata;

		setData["metadata.updated"] = new Date();

		const updateData: Record<string, unknown> = { $set: setData };

		if (unsetData)
			updateData.$unset = unsetData;

		const result = await this._collection.updateOne({ id }, updateData as any);

		if (result.matchedCount === 1)
			return await this.getProfileByQuery({ id });
	}

	/**
	 * Deletes a profile.
	 */
	async deleteProfile(id: string): Promise<boolean> {
		const result = await this._collection.deleteOne({ id });

		return result.deletedCount > 0;
	}

	/**
	 * Delete profiles
	 */
	async deleteProfiles(ids: string[]): Promise<boolean> {
		if (!ids || ids.length === 0)
			return true;

		const result = await this._collection.deleteMany({ id: { $in: ids } });

		return result.deletedCount > 0;
	}
}

export default ProfileRepo;
