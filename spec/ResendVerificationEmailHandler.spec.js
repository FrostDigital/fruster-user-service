const bus = require("fruster-bus");
const Db = require("mongodb").Db;
const conf = require('../config');
const mocks = require('./support/mocks.js');
const constants = require('../lib/constants.js');
const MailServiceClient = require("../lib/clients/MailServiceClient");
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");


describe("ResendVerificationEmailHandler", () => {

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => db = connection.db));

	afterEach((done) => {
		conf.requireEmailVerification = false;
		done();
	});

	it("should resend email", async () => {
		conf.requireEmailVerification = true;

		const testUserData = mocks.getUserWithUnverifiedEmailObject();
		let verificationToken;

		const mockSendMailService = mocks.mockMailService();

		const createUserResponse = (await mocks.createUser(testUserData)).data;

		await SpecUtils.delay(200);

		const testUser = await db.collection(constants.collections.USERS).findOne({ id: createUserResponse.id });

		verificationToken = testUser.emailVerificationToken;

		await SpecUtils.busRequest({
			subject: constants.endpoints.http.RESEND_VERIFICATION_EMAIL,
			data: {},
			params: { email: createUserResponse.email }
		});

		expect(mockSendMailService.requests[1].data.message.includes(verificationToken)).toBe(false, "mockSendMailService.requests[1].data.message.includes(verificationToken)");
		expect(mockSendMailService.requests[1].data.from).toBe(conf.emailVerificationFrom, "mockSendMailService.requests[1].data.from");
		expect(mockSendMailService.requests[1].data.to[0]).toBe(testUserData.email, "mockSendMailService.requests[1].data.to");
	});

});
