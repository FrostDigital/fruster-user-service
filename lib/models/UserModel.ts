import AccountDataSetModel from "./AccountDataSetModel";
import ProfileModel from "./ProfileModel";

type RoleManagerLike = {
	getScopesForRoles(roles: string[]): Promise<string[]>;
};

class UserModel extends AccountDataSetModel {
	profile?: ProfileModel;
	setPasswordToken?: string;

	constructor(json: Record<string, unknown>, isFilteredResult?: boolean) {
		super(json, isFilteredResult);

		if ("profile" in json)
			this.profile = new ProfileModel(json.profile as Record<string, unknown>);
	}

	/**
	 * Adds email verification and sets variables associated to the correct values.
	 */
	addEmailVerificationToken(emailVerificationToken: string): UserModel {
		this.emailVerificationToken = emailVerificationToken;
		this.emailVerified = false;

		return this;
	}

	/**
	 * add token for use when set password
	 */
	addSetPasswordToken(token: string): UserModel {
		this.setPasswordToken = token;

		return this;
	}

	/**
	 * Concats a ProfileModel with the UserModel
	 */
	concatWithProfile(profile: ProfileModel | null): UserModel {
		if (!profile)
			return this;

		const copyOfThis = Object.assign({}, this) as Record<string, unknown>;
		copyOfThis.profile = new ProfileModel(profile as unknown as Record<string, unknown>);

		return new UserModel(copyOfThis, false);
	}

	/**
	 * Converts to view model
	 */
	async toViewModel(roleManager?: RoleManagerLike): Promise<Record<string, unknown>> {
		const viewModel = await super.toViewModel(roleManager);

		if (viewModel.profile)
			viewModel.profile = await (viewModel.profile as ProfileModel).toViewModel(roleManager);

		return viewModel;
	}
}

export default UserModel;
