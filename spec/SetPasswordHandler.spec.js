const mocks = require('./support/mocks.js');
const SpecUtils = require('./support/SpecUtils');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");
const MailServiceClient = require('../lib/clients/MailServiceClient.js');
const config = require('../config.js');


describe("SetPasswordHandler", () => {

	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => { db = connection.db; }));

	it("should be possible to set password", async () => {
		const user = mocks.getUserObject();
		const createdUserResponse = await SpecUtils.createUser(user);

		const oldUser = await db.collection("users")
			.findOne({ id: createdUserResponse.data.id });

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.SET_PASSWORD,
			user: createdUserResponse.data,
			data: {
				newPassword: "Localhost:8081",
				id: createdUserResponse.data.id
			}
		});

		const newUser = await db.collection("users")
			.findOne({ id: createdUserResponse.data.id });

		expect(newUser.password).not.toBe(oldUser.password, "newUser.password");
		expect(newUser.salt).not.toBe(oldUser.salt, "newUser.salt");
		expect(newUser.hashDate).not.toBe(oldUser.hashDate, "newUser.hashDate");
	});

	it("should be possible to set password with token", async () => {
		const mockSendMailService = frusterTestUtils.mockService({
			subject: MailServiceClient.endpoints.SEND_MAIL,
			response: { status: 200 }
		});

		const { password, ...user } = mocks.getUserObject();
		user.roles.push("super-admin");

		config.requireSendSetPasswordEmail = true;

		const { data } = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		const oldUser = await db.collection("users").findOne({ id: data.id });

		const { status } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.SET_PASSWORD,
			data: {
				newPassword: "Localhost:8081",
				token: data.sendPasswordToken
			}
		});

		expect(status).toBe(202, "status");

		const newUser = await db.collection("users").findOne({ id: data.id });

		expect(newUser.password).toBeDefined("newUser.password");
		expect(newUser.salt).toBeDefined("newUser.salt");
		expect(newUser.hashDate).toBeDefined("newUser.hashDate");
	});

});
