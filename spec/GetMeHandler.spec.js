const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");
const bus = require("fruster-bus").testBus;
const config = require("../config");

describe("GetMeHandler", () => {

	beforeEach(() => config.useMeEndpoint = true)

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions());

	it("should return the logged in user", async () => {
		const user = { id: "ff9222d5-0042-4d14-9f37-470d86c5db81", roles: ["user"], scopes: ["test"], email: "hello@frost.se" };
		const { data } = await bus.request({
			subject: constants.endpoints.http.GET_ME,
			message: { user }
		});

		expect(data.id).toBe(user.id, "data.id");
		expect(data.roles).toEqual(user.roles, "data.roles");
		expect(data.scopes).toEqual(user.scopes, "data.scopes");
		expect(data.email).toBe(user.email, "data.email");
	});

	it("should return 403 if not logged in", async () => {
		try {
			await bus.request(constants.endpoints.http.GET_ME);
		} catch ({ status, error: { code } }) {
			expect(status).toBe(403, "error status");
			expect(code).toBe("MUST_BE_LOGGED_IN", "error code");
		}
	});

});
