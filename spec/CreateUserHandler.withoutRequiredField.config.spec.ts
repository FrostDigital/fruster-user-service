import conf from "../config";
import constants from "../lib/constants";
import specConstants from "./support/spec-constants";
import frusterTestUtils from "@fruster/test-utils";
import SpecUtils from "./support/SpecUtils";

/**
 * This is a separate test
 * because we need to set the config before frusterTestUtils.startBeforeEach
 * which means all other tests fail if set in the other test file 🤔
 */
describe("CreateUserHandler withoutRequiredField config", () => {

	beforeAll(() => {
		conf.requireNames = false;
		conf.requirePassword = false;
		conf.withoutRequiredField = true;
	});

	afterAll(() => SpecUtils.resetConfig());

	frusterTestUtils.startBeforeEach(specConstants.testUtilsOptions());

	it("should be possible to create user without any mandatory fields", async () => {
		const { status, data } = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, { a: "d" });

		expect(status).toBe(201);

		expect(data.id).toBeDefined();
		expect(data.a).toBeDefined();
	});
});
