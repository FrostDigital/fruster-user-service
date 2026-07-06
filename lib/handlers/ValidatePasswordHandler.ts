import { injectable, inject, subscribe } from "@fruster/decorators";
import UserRepo from "../repos/UserRepo";
import config from "../../config";
import { errors } from "@fruster/bus";
import deprecatedErrors from "../deprecatedErrors";
import log from "@fruster/log";
import UserModel from "../models/UserModel";
import PasswordManager from "../managers/PasswordManager";
import RoleManager from "../managers/RoleManager";
import constants from "../constants";


@injectable()
class ValidatePasswordHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private passwordManager!: PasswordManager;

	@inject()
	private roleManager!: RoleManager;

	@subscribe({
		subject: constants.endpoints.service.VALIDATE_PASSWORD,
		requestSchema: constants.schemas.request.VALIDATE_PASSWORD_REQUEST,
		responseSchema: constants.schemas.response.USER_RESPONSE,
		docs: {
			description: `Validates that inputted password becomes the same hash as for an account. Typically used by auth service for login. Response has status code \`200\` if successful. Validation can be done on ${config.usernameValidationDbField.join(",")}`,
			errors: {
				"user-service.EMAIL_NOT_VERIFIED": "Email has not yet been verified.",
				"user-service.401.3": "Invalid username or password.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}
	})
	async handle({ data: { username, password, additionalQuery } }: { data: { username: string; password: string; additionalQuery?: Record<string, unknown> } }) {
		try {
			username = username.toLowerCase().replace(/([.*+?=^!:${}()|[\]\/\\])/g, '\\$1');

			let query: Record<string, unknown> = { $or: [] as Record<string, unknown>[] };

			config.usernameValidationDbField.forEach((field: string) => (query.$or as Record<string, unknown>[]).push({
				[field]: { $regex: new RegExp(["^", username, "$"].join(""), "i") }
			}));

			if (additionalQuery)
				query = { ...query, ...additionalQuery };

			const [user] = await this.userRepo.getUsersByQueryInternal(query);

			if (user && (await this._validatePassword(user, password))) {
				if (config.requireEmailVerification &&
					user &&
					user.hasOwnProperty("emailVerified") &&
					!user.emailVerified)
					throw errors.get("fruster-user-service.EMAIL_NOT_VERIFIED");

				return {
					status: 200,
					data: await user.toViewModel(this.roleManager)
				};
			}

			throw deprecatedErrors.invalidUsernameOrPassword();
		} catch (err) {
			log.error(err);
			throw err;
		}
	}

	/**
	 * Validates that the password is the password of the user found in database.
	 * Returns user if validation is sucessful.
	 */
	async _validatePassword({ password: userPassword, salt, id, hashDate }: UserModel, password: string): Promise<boolean> {
		if ((await this.passwordManager.validatePassword(userPassword as string, salt as string, id as string, password, hashDate as Date | undefined)))
			return true;
		else
			return false;
	}

}

export default ValidatePasswordHandler;
