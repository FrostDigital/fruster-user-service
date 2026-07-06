import { Db } from "mongodb";
import { errors } from "@fruster/bus";
import * as userService from "../fruster-user-service";
import config from "../config";
import mocks from "./support/mocks";
import frusterTestUtils from "@fruster/test-utils";
import constants from "../lib/constants";
import specConstants from "./support/spec-constants";
import SpecUtils from "./support/SpecUtils";


describe("VerifyEmailAddressHandler", () => {

	let db: Db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => { db = connection.db; }));

	beforeAll(() => config.requireEmailVerification = true);

	afterAll(() => SpecUtils.resetConfig());

	afterEach(() => userService.stop());

	it("should remove emailVerificationToken and set emailVerified to true when verifying with emailVerificationToken", async () => {
		const testUserData = mocks.getUserWithUnverifiedEmailObject();

		const mockSendMailService = mocks.mockMailService();

		const createUserResponse = (await mocks.createUser(testUserData)).data;

		await SpecUtils.delay(200);

		const testUser: any = await db.collection(constants.collections.USERS).findOne({ id: createUserResponse.id });

		const verificationResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.http.VERIFY_EMAIL,
			params: { tokenId: testUser.emailVerificationToken }
		});

		expect(verificationResponse.status).toBe(200, "verificationResponse.status");

		const updatedTestUser: any = await db.collection(constants.collections.USERS).findOne({ id: createUserResponse.id });

		expect(updatedTestUser.emailVerificationToken).toBeUndefined("should remove emailVerificationToken");
		expect(updatedTestUser.emailVerified).toBe(true, "should set emailVerified to true");

		expect(mockSendMailService.requests[0].data.from).toBe(config.emailVerificationFrom, "mockSendMailService.requests[0].data.from");
		expect(mockSendMailService.requests[0].data.to[0]).toBe(testUserData.email, "mockSendMailService.requests[0].data.to");
	});

	it("should not be able to verify email with faulty token", async () => {
		const err: any = await SpecUtils.busRequestExpectError({
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
