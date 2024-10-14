const Db = require("mongodb").Db;
const errors = require("../lib/errors");
const userService = require("../fruster-user-service");
const config = require("../config");
const mocks = require("./support/mocks.js");
const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants.js");
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");


describe("VerifyEmailAddressHandler", () => {

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => db = connection.db));

	beforeAll(() => config.requireEmailVerification = true);

	afterAll(() => SpecUtils.resetConfig());

	afterEach(() => userService.stop());

	it("should remove emailVerificationToken and set emailVerified to true when verifying with emailVerificationToken", async () => {
		const testUserData = mocks.getUserWithUnverifiedEmailObject();

		const mockSendMailService = mocks.mockMailService();

		const createUserResponse = (await mocks.createUser(testUserData)).data;

		await SpecUtils.delay(200);

		const testUser = await db.collection(constants.collections.USERS).findOne({ id: createUserResponse.id });

		const verificationResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.http.VERIFY_EMAIL,
			params: { tokenId: testUser.emailVerificationToken }
		});

		expect(verificationResponse.status).toBe(200, "verificationResponse.status");

		const updatedTestUser = await db.collection(constants.collections.USERS).findOne({ id: createUserResponse.id });

		expect(updatedTestUser.emailVerificationToken).toBeUndefined("should remove emailVerificationToken");
		expect(updatedTestUser.emailVerified).toBe(true, "should set emailVerified to true");

		expect(mockSendMailService.requests[0].data.from).toBe(config.emailVerificationFrom, "mockSendMailService.requests[0].data.from");
		expect(mockSendMailService.requests[0].data.to[0]).toBe(testUserData.email, "mockSendMailService.requests[0].data.to");
	});

	it("should not be able to verify email with faulty token", async () => {
		const err = await SpecUtils.busRequestExpectError({
			subject: constants.endpoints.http.VERIFY_EMAIL,
			params: { tokenId: "ram.jam" }
		});

		expect(err.error.code).toBe(errors.get("fruster-user-service.INVALID_TOKEN").error.code);
	});

	it("should use sendgrid mail template if specified in config", async () => {
		config.emailVerificationTemplate = "band-ola";

		const testUserData = mocks.getUserWithUnverifiedEmailObject();

		const mockSendMailService = mocks.mockMailService();

		await mocks.createUser(testUserData);

		await SpecUtils.delay(200);

		expect(mockSendMailService.requests[0].data.from).toBe(config.emailVerificationFrom, "mockSendMailService.requests[0].data.from");
		expect(mockSendMailService.requests[0].data.to[0]).toBe(testUserData.email, "mockSendMailService.requests[0].data.to");
		expect(mockSendMailService.requests[0].data.templateId).toBe(config.emailVerificationTemplate, "mockSendMailService.requests[0].data.templateId");
	});

});
