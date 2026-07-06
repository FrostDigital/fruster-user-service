import { injectable, inject, subscribe } from "@fruster/decorators";
import { errors } from "@fruster/bus";
import UserRepo from "../../repos/UserRepo";
import constants from "../../constants";


@injectable()
class VerifyEmailAddressHandler {

	@inject()
	private userRepo!: UserRepo;

	@subscribe({
		subject: constants.endpoints.http.VERIFY_EMAIL,
		responseSchema: constants.schemas.response.VERIFY_EMAIL_ADDRESS_RESPONSE,
		docs: {
			description: "Verifies a user's email address by providing a token sent to the user by email. Response has status code `200` if successful.",
			params: {
				tokenId: "The email verification token to verify with."
			},
			errors: {
				"user-service.INVALID_TOKEN": "Provided token is invalid. Either it's a faulty token or it has already been used.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
			}
		}
	})
	async handleHttp(req: { params?: Record<string, any>; data: Record<string, any> }) {
		return this._verify(req);
	}

	@subscribe({
		subject: constants.endpoints.service.VERIFY_EMAIL,
		requestSchema: constants.schemas.request.VERIFY_EMAIL_ADDRESS_SERVICE_REQUEST,
		responseSchema: constants.schemas.response.VERIFY_EMAIL_ADDRESS_RESPONSE,
		docs: {
			description: "Verifies a user's email address by providing a token sent to the user by email. Response has status code `200` if successful.",
			errors: {
				"user-service.INVALID_TOKEN": "Provided token is invalid. Either it's a faulty token or it has already been used.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}
	})
	async handle(req: { params?: Record<string, any>; data: Record<string, any> }) {
		return this._verify(req);
	}

	async _verify(req: { params?: Record<string, any>; data: Record<string, any> }) {
		req.params = req.params || {};

		const verificationToken = req.params.tokenId || req.data.tokenId || "";
		const userFromToken = await this.userRepo.getUserByQuery({ emailVerificationToken: verificationToken });

		if (!userFromToken)
			throw errors.get("fruster-user-service.INVALID_TOKEN", verificationToken);

		await this.userRepo.updateUser(userFromToken.id as string,
			{ emailVerified: true },
			{ emailVerificationToken: undefined });

		return {
			status: 200,
			data: { verifiedEmail: userFromToken.email }
		};
	}

}

export default VerifyEmailAddressHandler;
