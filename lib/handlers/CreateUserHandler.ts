import { injectable, inject } from "@fruster/decorators";
import UserModel from "../models/UserModel";
import ProfileModel from "../models/ProfileModel";
import Utils from "../utils/Utils";
import EmailUtils from "../utils/EmailUtils";
import PasswordManager from "../managers/PasswordManager";
import RoleManager from "../managers/RoleManager";
import ProfileManager from "../managers/ProfileManager";
import UserManager from "../managers/UserManager";
import EmailManager from "../managers/EmailManager";
import UserRepo from "../repos/UserRepo";
import config from "../../config";


/**
 * NOTE: This handler is NOT wired via @subscribe. Its two subjects
 * (http admin create + service create) use config-conditional schema
 * getters (constants.schemas.request.CREATE_USER_REQUEST /
 * CREATE_USER_SERVICE_REQUEST, see lib/constants.ts) that must be
 * resolved at bus.subscribe() call time (service start), not at
 * decoration/import time. @subscribe's options object is evaluated
 * once when the class is defined, which would freeze the getter's
 * result and break config-driven schema selection (see
 * CreateUserHandler.config.spec.js / .withoutRequiredField.config.spec.js).
 * DI still uses @injectable/@inject; only the bus wiring stays manual
 * in fruster-user-service.ts.
 */
@injectable()
class CreateUserHandler {

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

	async handle({ reqId, data }: { reqId?: string; data: Record<string, unknown> }) {
		await this.userManager.validateInputData(data);

		let [user, profile] = this.profileManager.splitUserFields(data);

		user = new UserModel(user);
		profile.id = (user as UserModel).id;
		profile = new ProfileModel(profile);

		if ((user as UserModel).password) // no need to hash password if request has not password
			await this.passwordManager.hashPassword(user as UserModel);

		const needSendVerifyEmail = Utils.userShouldVerifyEmail(user as UserModel);
		let token;

		if (needSendVerifyEmail || config.requireSendSetPasswordEmail) {
			token = EmailUtils.generateToken((user as UserModel).email as string);

			if (needSendVerifyEmail)
				(user as UserModel).addEmailVerificationToken(token);
			else
				(user as UserModel).addSetPasswordToken(EmailUtils.getHashedToken(token));
		}

		let createdUser;

		try {
			createdUser = await this.userRepo.saveUser(user as UserModel);
		} catch (err) {
			throw this.userManager.handleUniqueIndexError(err, user as UserModel);
		}

		/** If profile has more keys than its id we need to save the profile, otherwise we don't bother */
		if (Object.keys(profile).length > 1) {
			const createdProfile = await this.profileManager.saveProfile(profile as ProfileModel);
			user = createdUser.concatWithProfile(createdProfile as ProfileModel);
		}

		if (needSendVerifyEmail) {
			EmailManager.sendVerificationEmail(reqId, user as UserModel, token as string);
		} else if (config.requireSendSetPasswordEmail) {
			EmailManager.sendSetPasswordEmail(reqId, user as UserModel, token as string);
		}

		return {
			status: 201,
			data: await (user as UserModel).toViewModel(this.roleManager)
		};
	}

}

export default CreateUserHandler;
