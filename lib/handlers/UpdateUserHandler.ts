import { injectable, inject, subscribe } from "@fruster/decorators";
import UserRepo from "../repos/UserRepo";
import Utils from "../utils/Utils";
import EmailUtils from "../utils/EmailUtils";
import config from "../../config";
import deprecatedErrors from "../deprecatedErrors";
import { errors } from "@fruster/bus";
import PasswordManager from "../managers/PasswordManager";
import RoleManager from "../managers/RoleManager";
import ProfileManager from "../managers/ProfileManager";
import UserManager from "../managers/UserManager";
import EmailManager from "../managers/EmailManager";
import UserModel from "../models/UserModel";
import log from "@fruster/log";
import constants from "../constants";


@injectable()
class UpdateUserHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private passwordManager!: PasswordManager;

	@inject()
	private roleManager!: RoleManager;

	@inject()
	private profileManager!: ProfileManager;

	@inject()
	private userManager!: UserManager;

	@subscribe({
		subject: constants.endpoints.service.UPDATE_USER,
		requestSchema: constants.schemas.request.UPDATE_USER_REQUEST,
		responseSchema: constants.schemas.response.USER_RESPONSE,
		docs: {
			description: "Updates a user. Can contain any number of custom fields. Response has status code `200` if successful. ",
			errors: {
				"user-service.404.1": "User not found.",
				"user-service.400.6": "Cannot update password. Cannot update password through user update",
				"user-service.400.10": "Email is not unique. Another account has already been registered with the provided email-address.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}
	})
	async handle({ reqId, data: { id: userId, ...updateUserData } }: { reqId?: string; data: Record<string, any> }) {
		updateUserData = this.userManager.validateUpdateData(updateUserData);

		if (updateUserData.email)
			updateUserData.email = updateUserData.email.toLowerCase();

		if (updateUserData.password && (!config.requirePasswordOnEmailUpdate && !updateUserData.email))
			throw deprecatedErrors.cannotUpdatePassword();

		/** If request body contains email */
		if (updateUserData.email)
			await this._handleEmailUpdateValidation(userId, updateUserData);

		delete updateUserData.password;

		/** If email verification is required, this has to be prepared */
		if (updateUserData.email && (config.requireEmailVerification || config.optionalEmailVerification)) {
			const getUser = await this.userRepo.getById(userId);

			if ((getUser as UserModel).email !== updateUserData.email && Utils.userShouldVerifyEmail(getUser as UserModel)) {
				log.debug("config.requireEmailVerification or config.optionalEmailVerification is true, so we need to prepare new email verification data for user", userId);
				const token = EmailUtils.generateToken(updateUserData.email);
				const updateUser = new UserModel({ ...getUser, ...updateUserData });
				updateUser.addEmailVerificationToken(token);
				EmailManager.sendVerificationEmail(reqId, updateUser, token);
			}
		}

		/** Splits update data into user / profile and only updates fields configured to be part of the user dataset */
		const [user] = await this.profileManager.splitUserFields(updateUserData);

		let updatedUser;

		try {
			updatedUser = await this._updateInDatabase(userId, user);
		} catch (err) {
			throw this.userManager.handleUniqueIndexError(err, user);
		}

		const returnUser = new UserModel(updatedUser as Record<string, unknown>);

		return {
			status: 200,
			data: await returnUser.toViewModel(this.roleManager)
		};
	}

	@subscribe({
		subject: constants.endpoints.http.admin.UPDATE_USER,
		requestSchema: constants.schemas.request.UPDATE_USER_HTTP_REQUEST,
		responseSchema: constants.schemas.response.USER_RESPONSE,
		permissions: [constants.permissions.ADMIN_ANY],
		mustBeLoggedIn: true,
		docs: {
			description: "Updates a user. Can contain any number of custom fields. Response has status code `200` if successful. ",
			errors: {
				"user-service.404.1": "User not found.",
				"user-service.400.6": "Cannot update password. Cannot update password through user update",
				"user-service.400.10": "Email is not unique. Another account has already been registered with the provided email-address.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			},
			params: {
				id: "The id of the user to update."
			}
		}
	})
	handleHttp(req: { data?: Record<string, any>; params: Record<string, any>; reqId?: string }) {
		req.data = req.data || {};
		req.data.id = req.params.id;

		return this.handle(req as { reqId?: string; data: Record<string, any> });
	}

	/**
	 * Validates everything related to updating email.
	 */
	async _handleEmailUpdateValidation(userId: string, updateUserData: Record<string, any>): Promise<void> {
		log.debug("Validates email of user", userId);

		if (config.requirePasswordOnEmailUpdate) {
			log.debug("Password is required to inputted when changing email for user", userId);

			/** If  password is required when changing email password has to be in request body */
			if (!updateUserData.password)
				throw errors.get("fruster-user-service.PASSWORD_REQUIRED");

			/** And it has to be valid. */
			else if (!await this.passwordManager.validatePasswordForUser(updateUserData.password, userId))
				throw errors.get("fruster-user-service.UNAUTHORIZED");
			else
				log.debug("Password validated correctly for user", userId);
		}

		/** Email has to be valid */
		if (!Utils.validateEmail(updateUserData.email))
			throw deprecatedErrors.invalidEmail(updateUserData.email);

		log.debug("Successfully validated email for user", userId);
	}

	/**
	 * Updates user in database.
	 */
	async _updateInDatabase(userId: string, updateUserData: Record<string, unknown>) {
		log.debug("Updates user", userId, "in database");

		const updateResponse = await this.userRepo.updateUser(userId, updateUserData);

		log.debug("Successfully updates user", userId, "in database");

		return updateResponse;
	}

}

export default UpdateUserHandler;
