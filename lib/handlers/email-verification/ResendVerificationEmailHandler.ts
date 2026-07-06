import { injectable, inject, subscribe } from "@fruster/decorators";
import UserRepo from "../../repos/UserRepo";
import EmailManager from "../../managers/EmailManager";
import EmailUtils from "../../utils/EmailUtils";
import UserModel from "../../models/UserModel";
import constants from "../../constants";

@injectable()
class ResendVerificationEmailHandler {

	@inject()
	private userRepo!: UserRepo;

	@subscribe({
		subject: constants.endpoints.http.RESEND_VERIFICATION_EMAIL,
		docs: {
			description: "Generates a new email verification token and resends email w/ token to the provided user. Response has status code `200` if successful.",
			params: {
				email: "The email address to resent the verification email to."
			},
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
			}
		}
	})
	async handleHttp(req: { reqId?: string; params: Record<string, any>; data: Record<string, any> }) {
		return this._resend(req);
	}

	@subscribe({
		subject: constants.endpoints.service.RESEND_VERIFICATION_EMAIL,
		requestSchema: constants.schemas.request.RESEND_VERIFICATION_EMAIL_REQUEST,
		docs: {
			description: "Generates a new email verification token and resends email w/ token to the provided user. Response has status code `200` if successful.",
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}
	})
	async handle(req: { reqId?: string; params: Record<string, any>; data: Record<string, any> }) {
		return this._resend(req);
	}

	async _resend({ reqId, params, data }: { reqId?: string; params: Record<string, any>; data: Record<string, any> }) {
		const email = params.email || data.email;
		const user = await this.userRepo.getUserByQuery({ email }) as UserModel;

		if (Object.keys(user).length > 0 &&
			user.hasOwnProperty("emailVerified") &&
			("emailVerified" in user && user.emailVerified === false)) {
			const token = EmailUtils.generateToken(user.email as string);
			user.addEmailVerificationToken(token);

			EmailManager.sendVerificationEmail(reqId, user, token);

			await this.userRepo.updateUser(user.id as string, { emailVerificationToken: user.emailVerificationToken });
		}

		return { status: 200 };
	}

}

export default ResendVerificationEmailHandler;
