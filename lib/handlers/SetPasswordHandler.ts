import { injectable, inject, subscribe } from "@fruster/decorators";
import UserRepo from "../repos/UserRepo";
import PasswordManager from "../managers/PasswordManager";
import errors from "../errors";
import EmailUtils from "../utils/EmailUtils";
import constants from "../constants";


@injectable()
class SetPasswordHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private passwordManager!: PasswordManager;

	@subscribe({
		subject: constants.endpoints.service.SET_PASSWORD,
		requestSchema: constants.schemas.request.SET_PASSWORD_REQUEST,
		docs: {
			description: "Sets password of a user. Used by password reset service. Note: Updating a user's password should be done w/ the update-password endpoint. Response has status code `202` if successful.",
			errors: {
				"user-service.400.3": "Invalid password. Password does not follow the configured validation.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened.",
				"BAD_REQUEST": "The request need id or token",
				"NOT_FOUND": "User cannot find for token"
			}
		}
	})
	async handle({ data: { id, token, newPassword } }: { data: { id?: string; token?: string; newPassword: string } }) {
		this.passwordManager.validatePasswordFollowsRegExp(newPassword);

		let updateChanges: Record<string, unknown> = {};

		if (!id) {
			if (!token)
				throw errors.badRequest("The request need id or token");

			const user = await this.userRepo.getUserByQuery({ setPasswordToken: EmailUtils.getHashedToken(token) });

			if (!user)
				throw errors.notFound(`User cannot find for token - ${token}`);

			id = user.id;
			updateChanges = { setPasswordToken: null };
		}

		const { password, salt, hashDate } = await this.passwordManager.hashPasswordForUserId(id as string, newPassword);

		await this.userRepo.updateUser(id as string, { password, salt, hashDate, ...updateChanges });

		return { status: 202 };
	}

}

export default SetPasswordHandler;
