import { injectable, inject, subscribe } from "@fruster/decorators";
import UserRepo from "../repos/UserRepo";
import UserModel from "../models/UserModel";
import PasswordManager from "../managers/PasswordManager";
import deprecatedErrors from "../deprecatedErrors";
import constants from "../constants";


@injectable()
class UpdatePasswordHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private passwordManager!: PasswordManager;

	@subscribe({
		subject: constants.endpoints.service.UPDATE_PASSWORD,
		requestSchema: constants.schemas.request.UPDATE_PASSWORD_REQUEST,
		docs: {
			description: "Updates password of an account. Requires to validation of old password before new can be set. Response has status code `202` if successful.",
			errors: {
				"user-service.400.3": "Invalid password. Password does not follow the configured validation.",
				"user-service.401.3": "Invalid username or password.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}
	})
	async handle(req: { data: { id: string; oldPassword: string; newPassword: string }; reqId?: string }) {
		const userId = req.data.id;
		const oldPassword = req.data.oldPassword;
		const newPassword = req.data.newPassword;

		this.passwordManager.validatePasswordFollowsRegExp(newPassword);

		let user = await this.userRepo.getById(userId);

		if (!user)
			throw deprecatedErrors.forbidden();

		await this._validatePassword(req.reqId, user, oldPassword);

		user = await this.passwordManager.hashPassword(user, newPassword);

		await this.userRepo.updateUser(userId, {
			password: user.password,
			salt: user.salt,
			hashDate: user.hashDate
		});

		return {
			status: 202
		};
	}

	@subscribe({
		subject: constants.endpoints.http.UPDATE_PASSWORD,
		requestSchema: constants.schemas.request.UPDATE_PASSWORD_HTTP_REQUEST,
		mustBeLoggedIn: true,
		docs: {
			description: "Updates password of auth user's account. Requires to validation of old password before new can be set. Response has status code `202` if successful.",
			errors: {
				"user-service.400.3": "Invalid password. Password does not follow the configured validation.",
				"user-service.401.3": "Invalid username or password.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}
	})
	async handleHttp(req: { data: { id?: string; oldPassword: string; newPassword: string }; user: { id: string }; reqId?: string }) {
		req.data.id = req.user.id;

		return this.handle(req as { data: { id: string; oldPassword: string; newPassword: string }; reqId?: string });
	}

	/**
	 * Validates that old password is the actual password of the user updating its password.
	 */
	async _validatePassword(reqId: string | undefined, user: UserModel, oldPassword: string): Promise<void> {
		if (!(await this.passwordManager.validatePassword(user.password as string, user.salt as string, user.id as string, oldPassword, user.hashDate)))
			throw deprecatedErrors.invalidUsernameOrPassword();
	}

}

export default UpdatePasswordHandler;
