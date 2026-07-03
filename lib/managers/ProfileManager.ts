import ProfileRepo from "../repos/ProfileRepo";
import UserModel from "../models/UserModel";
import ProfileModel from "../models/ProfileModel";
import constants from "../constants";
import config from "../../config";

class ProfileManager {
	_profileRepo: ProfileRepo;

	constructor(profileRepo: ProfileRepo) {
		this._profileRepo = profileRepo;
	}

	saveProfile(profile: ProfileModel) {
		return this._profileRepo.saveProfile(profile);
	}

	updateProfile(id: string, updateData: Record<string, unknown>) {
		return this._profileRepo.updateProfile(id, updateData);
	}

	getProfilesByQuery(
		query: Record<string, unknown>,
		start?: number,
		limit?: number,
		filter?: Record<string, unknown>,
		sort?: Record<string, unknown>,
		caseInsensitiveSort = false
	) {
		return this._profileRepo.getProfilesByQuery(query, start, limit, filter, sort, caseInsensitiveSort);
	}

	async expandUsersWithProfiles(users: UserModel[], filter: Record<string, unknown> = {}): Promise<UserModel[]> {
		const [profiles] = await this.getProfilesByQuery({
			id: { $in: users.map(u => u.id) }
		}, undefined, undefined, filter);

		const profilesById: Record<string, any> = {};

		(profiles as any[]).forEach(p => profilesById[p.id] = p);

		return users.map(u => u.concatWithProfile(profilesById[u.id as string]));
	}

	async expandUserWithProfile(user: UserModel, filter: Record<string, unknown> = {}): Promise<UserModel> {
		const expandedUserArray = await this.expandUsersWithProfiles([user], filter);
		return expandedUserArray[0];
	}

	splitUserFields(inputData: Record<string, unknown>): [Record<string, unknown>, Record<string, unknown>] {
		if (config.userFields.includes(constants.dataset.ALL_FIELDS) &&
			config.profileFields.includes(constants.dataset.ALL_FIELDS))
			return [inputData, {}];

		const fields: Record<string, string[]> = {
			USER: config.userFields.concat(constants.dataset.USER_REQUIRED_FIELDS),
			PROFILE: config.profileFields
		};

		let user: Record<string, unknown>;
		let profile: Record<string, unknown>;
		let primarySource = constants.dataset.USER;

		if (config.userFields.includes(constants.dataset.ALL_FIELDS) &&
			!config.profileFields.includes(constants.dataset.ALL_FIELDS))
			primarySource = constants.dataset.PROFILE;

		const primaryData = addFieldsToObject(inputData, fields[primarySource]);

		const secondaryData = addFieldsToObject(inputData,
			Object.keys(inputData).filter(key => !fields[primarySource].includes(key) &&
				!fields[primarySource].includes(constants.dataset.ALL_FIELDS)));

		switch (primarySource) {
			case constants.dataset.USER:
				user = primaryData;
				profile = secondaryData;
				break;
			case constants.dataset.PROFILE:
				user = secondaryData;
				profile = primaryData;
				break;
			default:
				user = primaryData;
				profile = secondaryData;
		}

		return [user, profile];

		function addFieldsToObject(inputData: Record<string, unknown>, fields: string[]): Record<string, unknown> {
			if (!fields || fields.includes(constants.dataset.ALL_FIELDS))
				return inputData;

			const output: Record<string, unknown> = {};
			Object.keys(inputData).filter(k => fields.includes(k)).map(k => output[k] = inputData[k]);

			return output;
		}
	}
}

export default ProfileManager;
