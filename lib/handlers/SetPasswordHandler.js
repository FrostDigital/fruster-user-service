const UserRepo = require("../repos/UserRepo");
const PasswordManager = require("../managers/PasswordManager");
const errors = require("../errors");
const FrusterRequest = require("fruster-bus").FrusterRequest;


class SetPasswordHandler {

	/**
	 * @param {UserRepo} userRepo
	 * @param {PasswordManager} passwordManager
	 */
	constructor(userRepo, passwordManager) {
		this._repo = userRepo;
		this._passwordManager = passwordManager;
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handle({ data: { id, token, newPassword } }) {
		this._passwordManager.validatePasswordFollowsRegExp(newPassword);

		let updateChanges = {};

		if (!id) {
			if (!token)
				throw errors.badRequest("The request need id or token");

			const user = await this._repo.getUserByQuery({ setPasswordToken: token });

			if (!user)
				throw errors.notFound(`User cannot find for token - ${token}`);

			id = user.id;
			updateChanges = { setPasswordToken: null };
		}

		const { password, salt, hashDate } = await this._passwordManager.hashPasswordForUserId(id, newPassword);

		await this._repo.updateUser(id, { password, salt, hashDate, ...updateChanges });

		return { status: 202 };
	}

}

module.exports = SetPasswordHandler;
