const bus = require("fruster-bus");
const Db = require("mongodb").Db;
const errors = require("../lib/errors");
const userService = require("../fruster-user-service");
const config = require("../config");
const mocks = require("./support/mocks.js");
const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants.js");
const specConstants = require("./support/spec-constants");
const MailServiceClient = require("../lib/clients/MailServiceClient");
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

		bus.subscribe(MailServiceClient.endpoints.SEND_MAIL, ({ reqId, data }) => {
			expect(data.from).toBe(config.emailVerificationFrom, "data.from");
			expect(data.to.includes(testUserData.email)).toBeTruthy("data.to.includes(testUserData.email)");
			return { reqId, status: 200 }
		});

		const createUserResponse = (await mocks.createUser(testUserData)).data;
		const testUser = await db.collection(constants.collections.USERS).findOne({ id: createUserResponse.id });
		const verificationResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.http.VERIFY_EMAIL,
			params: { tokenId: testUser.emailVerificationToken }
		});

		expect(verificationResponse.status).toBe(200, "verificationResponse.status");

		const updatedTestUser = await db.collection(constants.collections.USERS).findOne({ id: createUserResponse.id });

		expect(updatedTestUser.emailVerificationToken).toBeUndefined("should remove emailVerificationToken");
		expect(updatedTestUser.emailVerified).toBe(true, "should set emailVerified to true");
	});

	it("should not be able to verify email with faulty token", async done => {
		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.http.VERIFY_EMAIL,
				params: { tokenId: "ram.jam" }
			});

			done.fail();
		} catch (err) {
			expect(err.error.code).toBe(errors.get("fruster-user-service.INVALID_TOKEN").error.code);
			done();
		}
	});

	it("should use sendgrid mail template if specified in config", async done => {
		config.emailVerificationEmailTemplate = "band-ola";

		const testUserData = mocks.getUserWithUnverifiedEmailObject();

		bus.subscribe(MailServiceClient.endpoints.SEND_MAIL, ({ data }) => {
			expect(data.from).toBe(config.emailVerificationFrom, "from");
			expect(data.to[0]).toBe(testUserData.email, "to");
			expect(data.templateId).toBe(config.emailVerificationEmailTemplate, "templateId");

			done();
		});

		await mocks.createUser(testUserData);
	});

});
