import { Db } from "mongodb";
import conf from "../config";
import mocks from "./support/mocks";
import constants from "../lib/constants";
import frusterTestUtils from "@fruster/test-utils";
import specConstants from "./support/spec-constants";
import SpecUtils from "./support/SpecUtils";


describe("ResendVerificationEmailHandler", () => {

	let db: Db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => { db = connection.db; }));

	afterEach(() => {
		conf.requireEmailVerification = false;
	});

	it("should resend email", async () => {
		conf.requireEmailVerification = true;

		const testUserData = mocks.getUserWithUnverifiedEmailObject();

		const mockSendMailService = mocks.mockMailService();

		const createUserResponse = (await mocks.createUser(testUserData)).data;

		await SpecUtils.delay(200);

		const testUser = await db.collection(constants.collections.USERS).findOne({ id: createUserResponse.id });

		const verificationToken = testUser!.emailVerificationToken;

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
