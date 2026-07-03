import { injectable, subscribe } from "@fruster/decorators";
import constants from "../constants";


@injectable()
class GetMeHandler {

	@subscribe({
		subject: constants.endpoints.http.GET_ME,
		responseSchema: constants.schemas.response.GET_ME_RESPONSE,
		mustBeLoggedIn: true,
		docs: {
			description: "Returns the logged in user's user details"
		}
	})
	async handleHttp({ user }: { user: unknown }) {
		return {
			status: 200,
			data: user
		};
	}

}

export default GetMeHandler;
