import { injectable, inject, subscribe } from "@fruster/decorators";
import ProfileRepo from "../repos/ProfileRepo";
import UserManager from "../managers/UserManager";
import ProfileManager from "../managers/ProfileManager";
import constants from "../constants";


/**
 * NOTE: Only instantiated (and thus only registered via @subscribe) when
 * profile-splitting is configured -- see the conditional in
 * fruster-user-service.ts (config.profileFields / config.userFields).
 */
@injectable()
class UpdateProfileHandler {

	@inject()
	private profileRepo!: ProfileRepo;

	@inject()
	private userManager!: UserManager;

	@inject()
	private profileManager!: ProfileManager;

	@subscribe({
		subject: constants.endpoints.service.UPDATE_PROFILE,
		requestSchema: constants.schemas.request.UPDATE_PROFILE_REQUEST,
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
	async handle(req: { data: Record<string, any> }) {
		const id = req.data.id;

		let updateProfileData = req.data;

		/** Splits update data into user / profile and only updates fields configured to be part of the profile dataset */
		let [, profile] = this.profileManager.splitUserFields(updateProfileData);

		profile = this.userManager.validateUpdateData(profile);

		const updatedProfile = await this.profileManager.updateProfile(id, profile);

		return {
			status: 200,
			data: updatedProfile
		};
	}

}

export default UpdateProfileHandler;
