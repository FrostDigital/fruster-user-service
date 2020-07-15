const uuid = require("uuid");
const testBus = require("fruster-bus").testBus;
const config = require('../config');
const mocks = require('./support/mocks.js');
const SpecUtils = require('./support/SpecUtils');
const constants = require('../lib/constants.js');
const MailServiceClient = require("../lib/clients/MailServiceClient");
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");
const errors = require('../lib/errors');
const Db = require("mongodb").Db;


describe("UpdateUserHandler", () => {

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => db = connection.db));

	afterEach(() => SpecUtils.resetConfig());

	it("should return updated user when updating user", async () => {
		const user = mocks.getUserObject();
		const createdUserResponse = await SpecUtils.createUser(user);
		const newFirstName = "Roland";
		const newLastName = "Svensson";
		const updateResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.service.UPDATE_USER,
			data: { id: createdUserResponse.data.id, firstName: newFirstName, lastName: newLastName }
		});

		expect(updateResponse.data.firstName).toBe(newFirstName, "updateResponse.data.firstName");
		expect(updateResponse.data.lastName).toBe(newLastName, "updateResponse.data.lastName");
		expect(new Date(updateResponse.data.metadata.updated).getTime())
			.toBeGreaterThan(new Date(createdUserResponse.data.metadata.updated).getTime(), "updateResponse.data.metadata.updated")

		const testUser = await db.collection(constants.collections.USERS).findOne({ id: updateResponse.data.id });

		expect(testUser.emailVerified).toBe(true, "updateResponse.data.emailVerified");
		expect(testUser.emailVerificationToken).toBeUndefined("testUser.emailVerificationToken");
	});

	it("should filter out profile fields and only update user fields when updating user when configured to split user data", async () => {
		config.userFields = ["isRelatedToSlatan"];
		const user = mocks.getUserObject();
		const createdUserResponse = await SpecUtils.createUser(user);
		const newFirstName = "Roland";
		const newLastName = "Svensson";

		const updateResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.service.UPDATE_USER,
			data: { id: createdUserResponse.data.id, firstName: newFirstName, lastName: newLastName, isRelatedToSlatan: false }
		});

		expect(updateResponse.data.firstName).toBeUndefined("updateResponse.data.firstName");
		expect(updateResponse.data.lastName).toBeUndefined("updateResponse.data.lastName");
		expect(updateResponse.data.isRelatedToSlatan).toBeFalsy("updateResponse.data.isRelatedToSlatan");
		expect(new Date(updateResponse.data.metadata.updated).getTime())
			.toBeGreaterThan(new Date(createdUserResponse.data.metadata.updated).getTime(), "updateResponse.data.metadata.updated")

		const testUser = await db.collection(constants.collections.USERS).findOne({ id: updateResponse.data.id });

		expect(testUser.emailVerified).toBe(true, "updateResponse.data.emailVerified");
		expect(testUser.emailVerificationToken).toBeUndefined("testUser.emailVerificationToken");
	});

	it("should return updated user when updating user via http", async () => {
		const user = mocks.getUserObject();
		const createdUserResponse = await SpecUtils.createUser(user);
		const newFirstName = "Roland";
		const newLastName = "Svensson";
		const updateResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.http.admin.UPDATE_USER,
			user: { scopes: ["admin.*"] },
			data: { firstName: newFirstName, lastName: newLastName },
			params: { id: createdUserResponse.data.id }
		});

		expect(updateResponse.data.firstName).toBe(newFirstName, "updateResponse.data.firstName");
		expect(updateResponse.data.lastName).toBe(newLastName, "updateResponse.data.lastName");
		expect(new Date(updateResponse.data.metadata.updated).getTime())
			.toBeGreaterThan(new Date(createdUserResponse.data.metadata.updated).getTime(), "updateResponse.data.metadata.updated")

		const testUser = await db.collection(constants.collections.USERS).findOne({ id: updateResponse.data.id });

		expect(testUser.emailVerified).toBe(true, "updateResponse.data.emailVerified");
		expect(testUser.emailVerificationToken).toBeUndefined("testUser.emailVerificationToken");
	});

	it("should return error when user can't be updated", async done => {
		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.UPDATE_USER,
				data: { id: "ID_", email: "hello" }
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(400, "err.status");
			done();
		}
	});

	it("should return error when trying to update password", async done => {
		const user = mocks.getUserObject();
		const createdUserResponse = await SpecUtils.createUser(user);

		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.UPDATE_USER,
				data: { id: createdUserResponse.data.id, password: "new-password" }
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(400, err.status);
			expect(err.data).toBeUndefined("err.data");

			done();
		}
	});

	it("should return error when trying to update email with faulty email", async done => {
		const user = mocks.getUserObject();
		const createdUserResponse = await SpecUtils.createUser(user);

		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.UPDATE_USER,
				data: { id: createdUserResponse.data.id, email: "hello" }
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(400, "err.status");
			done();
		};
	});

	it("should return error when trying to update email with existing email", async done => {
		const user = mocks.getUserObject();
		const email = "new-email" + Math.random() + "@gotmail.com";

		const createdUserResponse = await SpecUtils.createUser(user);
		const id = createdUserResponse.data.id;
		user.email = email;

		await SpecUtils.createUser(user);

		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.UPDATE_USER,
				data: { id: id, email: email }
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(400, "err.status");
			done();
		}
	});

	it("should be possible to send old email with update request", async () => {
		const user = mocks.getUserObject();
		const email = user.email;

		const createdUserResponse = await SpecUtils.createUser(user);
		const id = createdUserResponse.data.id;
		user.email = email;

		const updateResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.service.UPDATE_USER,
			data: { id: id, email: email, firstName: "greg" }
		});

		expect(updateResponse.status).toBe(200, "updateResponse.status");
	});

	it("should require password when updating email if config.requirePasswordOnEmailUpdate is true", async done => {
		try {
			config.requirePasswordOnEmailUpdate = true;

			const user = mocks.getUserObject();
			const email = "rambo.dreadlock@fejkmejl.se";

			const createdUserResponse = await SpecUtils.createUser(user);
			const id = createdUserResponse.data.id;
			user.email = email;

			await SpecUtils.busRequest({
				subject: constants.endpoints.service.UPDATE_USER,
				data: { id, email }
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(errors.get("fruster-user-service.PASSWORD_REQUIRED").status);
			expect(err.error.code).toBe(errors.get("fruster-user-service.PASSWORD_REQUIRED").error.code);

			done();
		}
	});

	it("should not be possible to provide incorrect password when updating email if config.requirePasswordOnEmailUpdate is true", async done => {
		try {
			config.requirePasswordOnEmailUpdate = true;

			const user = mocks.getUserObject();
			const email = "rambo.dreadlock@fejkmejl.se";

			const createdUserResponse = await SpecUtils.createUser(user);
			const id = createdUserResponse.data.id;
			user.email = email;

			await SpecUtils.busRequest({
				subject: constants.endpoints.service.UPDATE_USER,
				data: { id, email, password: "This is incorrect" }
			});
			done.fail();
		} catch (err) {
			expect(err.status).toBe(errors.get("fruster-user-service.UNAUTHORIZED").status);
			expect(err.error.code).toBe(errors.get("fruster-user-service.UNAUTHORIZED").error.code);

			done();
		}
	});

	it("should be possible to update email with correct password if config.requirePasswordOnEmailUpdate is true", async () => {
		config.requirePasswordOnEmailUpdate = true;

		const user = mocks.getUserObject();
		const email = "rambo.dreadlock@fejkmejl.se";

		const createdUserResponse = await SpecUtils.createUser(user);
		const id = createdUserResponse.data.id;
		user.email = email;

		const updateResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.service.UPDATE_USER,
			data: { id, email, password: user.password }
		});

		expect(updateResponse.status).toBe(200, "updateResponse.status");
		expect(updateResponse.data.email).toBe(email, "updateResponse.data.email");
	});

	it("should not return error if no fields are updated", async () => {
		const user = mocks.getUserObject();
		const email = user.email;

		const createdUserResponse = await SpecUtils.createUser(user);
		const id = createdUserResponse.data.id;
		user.email = email;

		const updateResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.service.UPDATE_USER,
			data: { id: id, email: email, firstName: user.firstName, lastName: user.lastName }
		});

		expect(updateResponse.status).toBe(200, "updateResponse.status");
	});

	it("should resend verification mail when updating email if conf.requireEmailVerification is set to true", async () => {
		config.requireEmailVerification = true;
		mocks.mockMailService();

		const user = mocks.getUserObject();
		const email = user.email;
		let id;

		const createdUserResponse = await SpecUtils.createUser(user);
		id = createdUserResponse.data.id;
		user.email = email;

		const updateResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.service.UPDATE_USER,
			data: { id: id, email: email, firstName: user.firstName, lastName: user.lastName }
		});

		const testUser = await db.collection(constants.collections.USERS).findOne({ id: updateResponse.data.id });

		expect(updateResponse.status).toBe(200, "updateResponse.status");
		expect(testUser.emailVerified).toBe(false, "updateResponse.data.emailVerified");
		expect(testUser.emailVerificationToken).toBeDefined("testUser.emailVerificationToken");
		expect(new Date(updateResponse.data.metadata.updated).getTime())
			.toBeGreaterThan(new Date(createdUserResponse.data.metadata.updated).getTime(), "updateResponse.data.metadata.updated")
	});

	it("should resend verification mail when updating email if conf.requireEmailVerification is set to true and conf.emailVerificationEmailTemplate and config.requirePasswordOnEmailUpdate set", async () => {
		config.requireEmailVerification = true;
		config.requirePasswordOnEmailUpdate = true;
		config.emailVerificationEmailTemplate = uuid.v4();

		const newEmail = "ram@ram.se";
		let invocations = 0;

		mocks.mockMailService(req => {
			/** The first time mail service will be contacted is when the user is created, so we only want check the second */
			if (invocations > 0) {
				expect(req.data.templateArgs.user.email).toBe(newEmail, "req.data.templateArgs.user.email");
				expect(req.data.templateArgs.user.firstName).toBe(user.firstName, "req.data.templateArgs.user.firstName");
				expect(req.data.templateArgs.user.lastName).toBe(user.lastName, "req.data.templateArgs.user.lastName");
			}

			invocations++;
		});

		const user = mocks.getUserObject();
		const createdUserResponse = await SpecUtils.createUser(user);
		const updateResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.service.UPDATE_USER,
			skipOptionsRequest: true,
			data: { id: createdUserResponse.data.id, email: newEmail, firstName: user.firstName, lastName: user.lastName, password: user.password }
		});

		const testUser = await db.collection(constants.collections.USERS).findOne({ id: updateResponse.data.id });

		expect(updateResponse.status).toBe(200, "updateResponse.status");
		expect(testUser.emailVerified).toBe(false, "updateResponse.data.emailVerified");
		expect(testUser.emailVerificationToken).toBeDefined("testUser.emailVerificationToken");
		expect(invocations).toBeGreaterThan(0, "mail service invocations");
		expect(new Date(updateResponse.data.metadata.updated).getTime())
			.toBeGreaterThan(new Date(createdUserResponse.data.metadata.updated).getTime(), "updateResponse.data.metadata.updated")
	});

	it("should resend verification mail when updating email if conf.requireEmailVerification is set to true and conf.verificationEmailTemplates and config.requirePasswordOnEmailUpdate set", async () => {
		config.requireEmailVerification = true;
		config.requirePasswordOnEmailUpdate = true;
		config.verificationEmailTemplates = "admin:596a3cee-21a2-4066-b169-9bd63579267d";

		const mockSendMailService = frusterTestUtils.mockService({
			subject: MailServiceClient.endpoints.SEND_MAIL,
			response: { status: 200 }
		});

		const { data: createdUser } = await testBus.request({
			subject: constants.endpoints.service.CREATE_USER,
			message: {
				data: mocks.getUserObject()
			}
		});

		const newEmail = "ram@ram.se";

		await testBus.request({
			subject: constants.endpoints.service.UPDATE_USER,
			message: {
				data: {
					id: createdUser.id,
					email: newEmail,
					firstName: createdUser.firstName,
					lastName: createdUser.lastName,
					password: mocks.getUserObject().password
				}
			}
		});

		const testUser = await db.collection(constants.collections.USERS).findOne({ id: createdUser.id });

		expect(testUser.emailVerified).toBe(false, "testUser.emailVerified");
		expect(testUser.emailVerificationToken).toBeDefined("testUser.emailVerificationToken");

		expect(mockSendMailService.requests[1].data.templateArgs.user.email).toBe(newEmail, "email");
	});

	it("should resend verification mail when updating email if conf.optionalEmailVerification is set to true", async () => {
		config.optionalEmailVerification = true;
		mocks.mockMailService();

		const user = mocks.getUserObject();
		const email = user.email;
		let id;

		const createdUserResponse = await SpecUtils.createUser(user);
		id = createdUserResponse.data.id;
		user.email = email;

		const updateResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.service.UPDATE_USER,
			data: { id: id, email: email, firstName: user.firstName, lastName: user.lastName }
		});

		const testUser = await db.collection(constants.collections.USERS).findOne({ id: updateResponse.data.id });

		expect(updateResponse.status).toBe(200, "updateResponse.status");
		expect(testUser.emailVerified).toBe(false, "updateResponse.data.emailVerified");
		expect(testUser.emailVerificationToken).toBeDefined("testUser.emailVerificationToken");
	});

});
