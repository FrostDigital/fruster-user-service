const UserRepo = require("../../repos/UserRepo");
const FrusterRequest = require("fruster-bus").FrusterRequest;
const EmailManager = require('../../managers/EmailManager');
const EmailUtils = require("../../utils/EmailUtils");

class ResendVerificationEmailHandler {

	/**
	 * @param {UserRepo} userRepo
	 */
	constructor(userRepo) {
		this._repo = userRepo;
	}

	/**
	 * @param {FrusterRequest} req
	 */
	async handle({ reqId, params, data }) {
		const email = params.email || data.email;
		const user = await this._repo.getUserByQuery({ email });

		if (Object.keys(user).length > 0 &&
			user.hasOwnProperty("emailVerified") &&
			("emailVerified" in user && user.emailVerified === false)) {
			const token = EmailUtils.generateToken(user.email);
			user.addEmailVerificationToken(token);

			EmailManager.sendVerificationEmail(reqId, user, token);

			await this._repo.updateUser(user.id, { emailVerificationToken: user.emailVerificationToken });
		}

		return { status: 200 };
	}

}

module.exports = ResendVerificationEmailHandler;
