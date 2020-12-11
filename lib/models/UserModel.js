const AccountDataSetModel = require("./AccountDataSetModel");
const ProfileModel = require("./ProfileModel");
const RoleManager = require("../managers/RoleManager");


class UserModel extends AccountDataSetModel {

	/**
	 * @typedef {Object} JsonInput
	 *
	 * @property {String=} id
	 * @property {String} email
	 * @property {String} password
	 * @property {String=} salt
	 * @property {(Date|String|Number)=} hashDate
	 * @property {String} firstName
	 * @property {String} lastName
	 * @property {String=} middleName
	 * @property {Array<String>} roles
	 * @property {Boolean=} emailVerified
	 * @property {String=} emailVerificationToken
	 * @property {ProfileModel=} profile
	 * @property {Object=} metadata
	 * @property {Date=} metadata.created
	 * @property {Date=} metadata.updated
	 */

	/**
	 * @param {JsonInput} json
	 * @param {Boolean=} isFilteredResult whether or not json is filtered result.
	 */
	constructor(json, isFilteredResult) {
		super(json, isFilteredResult);

		if ("profile" in json)
			this.profile = new ProfileModel(json.profile);
	}

	/**
	 * Adds email verification and sets variables associated to the correct values.
	 *
	 * @param {String} emailVerificationToken
	 *
	 * @return {UserModel}
	 */
	addEmailVerificationToken(emailVerificationToken) {
		this.emailVerificationToken = emailVerificationToken;
		this.emailVerified = false;

		return this;
	}

	/**
	 * add token for use when set password
	 *
	 * @param {String} token
	 *
	 * @return {UserModel}
	 */
	addSetPasswordToken(token) {
		this.setPasswordToken = token;

		return this;
	}

	/**
	 * Concats a ProfileModel with the UserModel
	 *
	 * @param {ProfileModel} profile the profile to concat with
	 *
	 * @return {UserModel}
	 */
	concatWithProfile(profile) {
		if (!profile)
			return this;

		const copyOfThis = Object.assign({}, this);
		// @ts-ignore
		copyOfThis.profile = new ProfileModel(profile);

		return new UserModel(copyOfThis, false);
	}

	/**
	 * Converts to view model
	 *
	 * @override
	 *
	 * @param {RoleManager=} roleManager
	 */
	async toViewModel(roleManager) {
		const viewModel = await super.toViewModel(roleManager);

		if (viewModel.profile)
			viewModel.profile = await viewModel.profile.toViewModel(roleManager);

		return viewModel;
	}

}

module.exports = UserModel;
