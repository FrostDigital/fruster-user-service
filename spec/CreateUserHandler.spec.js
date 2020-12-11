const Db = require("mongodb").Db;
const config = require("../config");
const mocks = require("./support/mocks.js");
const constants = require("../lib/constants.js");
const testBus = require("fruster-bus").testBus;
const MailServiceClient = require("../lib/clients/MailServiceClient");
const SpecUtils = require("./support/SpecUtils");
const frusterTestUtils = require("fruster-test-utils");
const RoleManager = require("../lib/managers/RoleManager");
const RoleScopesConfigRepo = require("../lib/repos/RoleScopesConfigRepo");
const specConstants = require("./support/spec-constants");


describe("CreateUserHandler", () => {

	/** @type {RoleManager} */
	let roleManager;

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async connection => {
				db = connection.db;
				const roleScopesConfigRepo = new RoleScopesConfigRepo();
				await roleScopesConfigRepo.prepareRoles();
				roleManager = new RoleManager(roleScopesConfigRepo);
			}));

	afterEach((done) => {
		SpecUtils.resetConfig();
		done();
	});

	it("should be possible to create user", async () => {
		mocks.mockMailService();

		const user = mocks.getUserObject();
		user.roles.push("super-admin");

		const response = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		expect(response.status).toBe(201, "response.status");

		expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
		expect(response.error).toBeUndefined("response.error");

		expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
		expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
		expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
		expect(response.data.email).toBe(user.email, "response.data.email");

		const roles = await roleManager.getRoles();
		const currentRoleScopes = [];

		Object.keys(roles)
			.forEach(role => {
				roles[role].forEach(scope => {
					if (!currentRoleScopes.includes(scope))
						currentRoleScopes.push(scope);
				});
			});

		expect(response.data.scopes.length).toBe(currentRoleScopes.length, "response.data.scopes.length");
	});

	it("should be possible to create user split into user and profile datasets", async () => {
		const testBegan = new Date();

		config.userFields = ["isRelatedToSlatan"];

		const user = mocks.getUserObject();
		user.roles.push("super-admin");
		user.isRelatedToSlatan = true;

		const response = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		expect(response.status).toBe(201, "response.status");

		expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
		expect(response.error).toBeUndefined("response.error");

		expect(response.data.profile.firstName).toBe(user.firstName, "response.data.firstName");
		expect(response.data.profile.middleName).toBe(user.middleName, "response.data.middleName");
		expect(response.data.profile.lastName).toBe(user.lastName, "response.data.lastName");
		expect(response.data.email).toBe(user.email, "response.data.email");
		expect(response.data.metadata.created).toBeDefined("response.data.metadata.created");
		expect(response.data.metadata.updated).toBeDefined("response.data.metadata.updated");
		expect(response.data.metadata.updated).toBe(response.data.metadata.created, "when user has just been created metadata.updated and metadata.created should be the same");

		expect(response.data.profile.metadata.created).toBeDefined("response.data.profile.metadata.created");
		expect(response.data.profile.metadata.updated).toBeDefined("response.data.profile.metadata.updated");
		expect(response.data.profile.metadata.updated)
			.toBe(response.data.profile.metadata.created, "when user has just been created profile.metadata.updated and profile.metadata.created should be the same");

		const userFromDatabase = await db.collection(constants.collections.USERS).findOne({ id: response.data.id });
		const profileFromDatabase = await db.collection(constants.collections.PROFILES).findOne({ id: response.data.profile.id });

		expect(userFromDatabase.password).toBeDefined("userFromDatabase.password");
		expect(new Date(userFromDatabase.hashDate).getTime()).toBeGreaterThan(testBegan.getTime());
		expect(userFromDatabase.salt).toBeDefined("userFromDatabase.salt");
		expect(userFromDatabase.roles).toBeDefined("userFromDatabase.roles");
		expect(userFromDatabase.roles.length).toBe(user.roles.length, "userFromDatabase.roles.length");
		expect(userFromDatabase.roles.join(",")).toBe(user.roles.join(","), "userFromDatabase.roles.join(',')");
		expect(userFromDatabase.emailVerified).toBeDefined("userFromDatabase.emailVerified");
		expect(userFromDatabase.id).toBeDefined("userFromDatabase.id");
		expect(userFromDatabase.isRelatedToSlatan).toBeDefined("userFromDatabase.isRelatedToSlatan");

		expect(profileFromDatabase.firstName).toBe(user.firstName, "profileFromDatabase.firstName");
		expect(profileFromDatabase.lastName).toBe(user.lastName, "profileFromDatabase.lastName");

		const roles = await roleManager.getRoles();
		const currentRoleScopes = [];

		Object.keys(roles)
			.forEach(role => {
				roles[role].forEach(scope => {
					if (!currentRoleScopes.includes(scope))
						currentRoleScopes.push(scope);
				});
			});

		expect(response.data.scopes.length).toBe(currentRoleScopes.length, "response.data.scopes.length");
	});

	it("should be possible to create user with custom fields", async () => {
		const user = mocks.getUserObject();
		user.roles.push("super-admin");

		/** Custom fields */
		user.profileImage = "http://pipsum.com/435x310.jpg";
		user.custom = "field";

		const response = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		expect(response.status).toBe(201, "response.status");

		expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
		expect(response.error).toBeUndefined("response.error");

		expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
		expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
		expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
		expect(response.data.email).toBe(user.email, "response.data.email");
		expect(response.data.profileImage).toBe(user.profileImage, "response.data.profileImage");
		expect(response.data.custom).toBe(user.custom, "response.data.custom");

		const roles = await roleManager.getRoles();
		const currentRoleScopes = [];

		Object.keys(roles)
			.forEach(role => {
				roles[role].forEach(scope => {
					if (!currentRoleScopes.includes(scope))
						currentRoleScopes.push(scope);
				});
			});

		expect(response.data.scopes.length).toBe(currentRoleScopes.length, "response.data.scopes.length");
	});

	it("should not create the same role more than once when creating user", async () => {
		const user = mocks.getUserObject();
		user.roles.push("admin");
		user.roles.push("admin");
		user.roles.push("admin");
		user.roles.push("user");

		const response = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		expect(response.status).toBe(201, "response.status");

		expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
		expect(response.error).toBeUndefined("response.error");

		expect(response.data.roles.length).toBe(2, "response.data.roles.length");
	});

	it("should validate password when creating user", async done => {
		const user = mocks.getUserObject();
		user.password = "hej";

		try {
			await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

			done.fail("should not be possible to create user with faulty password");
		} catch (err) {
			expect(err.status).toBe(400, "err.statu");

			expect(err.data).toBeUndefined("err.data");
			expect(Object.keys(err.error).length).not.toBe(0, "Object.keys(err.error).length");

			done();
		}
	});

	it("should validate email when creating user", async done => {
		const user = mocks.getUserObject();
		user.email = "email";

		try {
			await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

			done.fail("should not be possible to create user with faulty email");
		} catch (err) {
			expect(err.status).toBe(400, "err.status");

			expect(err.data).toBeUndefined("err.data");
			expect(Object.keys(err.error).length).not.toBe(0);

			done();
		}
	});

	it("should validate indexed duplicates email when creating user", async done => {
		await db.collection(constants.collections.USERS)
			.createIndex({ firstName: 1 }, {
				unique: true,
				partialFilterExpression: { firstName: { $exists: true } }
			});

		const user = mocks.getUserObject();
		user.email = "email@email.com";

		try {
			await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

			const user2 = mocks.getUserObject();
			user2.email = "email2@email.com";

			await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user2);

			done.fail("should not be possible to create user with faulty email");
		} catch (err) {
			expect(err.status).toBe(400, "err.status");

			expect(err.data).toBeUndefined("err.data");
			expect(Object.keys(err.error).length).not.toBe(0);

			done();
		}
	});

	it("should validate required fields when creating user", async () => {
		let user = mocks.getUserObject();
		delete user.firstName;
		await doRequest(user);

		user = mocks.getUserObject();
		delete user.lastName;
		await doRequest(user);

		user = mocks.getUserObject();
		delete user.email;
		await doRequest(user);

		user = mocks.getUserObject();
		delete user.password;
		await doRequest(user);

		user = mocks.getUserObject();
		delete user.lastName;
		await doRequest(user);

		async function doRequest(userToCreate) {
			try {
				await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, userToCreate);
			} catch (err) {
				expect(err.status).toBe(400, "err.status");
				expect(err.data).toBeUndefined("err.data");
				expect(Object.keys(err.error).length).not.toBe(0, "Object.keys(err.error).length");
				return;
			}
		}
	});

	it("should not require password to be set if configured not to", async () => {
		config.requirePassword = false;

		const user = mocks.getUserObject();
		delete user.password;

		const savedUser = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		expect(savedUser.data.id).toBeDefined("savedUser.data.id");
	});

	it("should generate email verification token when config requireEmailVerification is true", async () => {
		mocks.mockMailService();

		config.requireEmailVerification = true;

		const user = mocks.getUserObject();
		const response = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		await SpecUtils.delay(200);

		expect(response.status).toBe(201, "response.status");

		expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
		expect(response.error).toBeUndefined("response.error");

		expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
		expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
		expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
		expect(response.data.email).toBe(user.email, "response.data.email");
		expect(response.data.emailVerified).toBe(false, "response.data.emailVerified");
		expect(response.data.emailVerificationToken).toBeUndefined("response.data.emailVerificationToken");

		const userFromDatabase = await (db.collection(constants.collections.USERS).findOne({ id: response.data.id }));
		expect(userFromDatabase.emailVerified).toBe(false, "userFromDatabase.emailVerified");
		expect(userFromDatabase.emailVerificationToken).toBeDefined("userFromDatabase.emailVerificationToken");

		const roles = await roleManager.getRoles();

		user.roles.forEach(role => {
			expect(response.data.scopes.length).toBe(Object.keys(roles[role.toLowerCase()]).length);
		});
	});

	it("should generate email verification token when config requireEmailVerification is true and emailVerificationForRoles has role admin", async () => {
		mocks.mockMailService();

		config.requireEmailVerification = true;
		config.emailVerificationForRoles = ["admin"]

		const user = mocks.getUserObject();
		const response = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		await SpecUtils.delay(200);

		expect(response.status).toBe(201, "response.status");

		expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
		expect(response.error).toBeUndefined("response.error");

		expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
		expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
		expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
		expect(response.data.email).toBe(user.email, "response.data.email");
		expect(response.data.emailVerified).toBe(false, "response.data.emailVerified");
		expect(response.data.emailVerificationToken).toBeUndefined("response.data.emailVerificationToken");

		const userFromDatabase = await (db.collection(constants.collections.USERS).findOne({ id: response.data.id }));
		expect(userFromDatabase.emailVerified).toBe(false, "userFromDatabase.emailVerified");
		expect(userFromDatabase.emailVerificationToken).toBeDefined("userFromDatabase.emailVerificationToken");

		const roles = await roleManager.getRoles();

		user.roles.forEach(role => {
			expect(response.data.scopes.length).toBe(Object.keys(roles[role.toLowerCase()]).length);
		});
	});

	it("should not generate email verification token when config requireEmailVerification is true and emailVerificationForRoles does not have role admin", async () => {
		mocks.mockMailService();

		config.requireEmailVerification = true;
		config.emailVerificationForRoles = ["user", "super-admin", "ramjam"]

		const user = mocks.getUserObject();
		const response = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		await SpecUtils.delay(200);

		expect(response.status).toBe(201, "response.status");

		expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
		expect(response.error).toBeUndefined("response.error");

		expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
		expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
		expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
		expect(response.data.email).toBe(user.email, "response.data.email");
		expect(response.data.emailVerified).toBeTruthy("response.data.emailVerified");
		expect(response.data.emailVerificationToken).toBeUndefined("response.data.emailVerificationToken");

		const userFromDatabase = await (db.collection(constants.collections.USERS).findOne({ id: response.data.id }));

		expect(userFromDatabase.emailVerified).toBeTruthy("userFromDatabase.emailVerified");
		expect(userFromDatabase.emailVerificationToken).toBeUndefined("userFromDatabase.emailVerificationToken");

		const roles = await roleManager.getRoles();

		user.roles.forEach(role => {
			expect(response.data.scopes.length).toBe(Object.keys(roles[role.toLowerCase()]).length);
		});
	});

	it("should generate email verification token when config optionalEmailVerification is true", async () => {
		mocks.mockMailService();

		config.optionalEmailVerification = true;

		const user = mocks.getUserObject();
		const response = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		await SpecUtils.delay(200);

		expect(response.status).toBe(201, "response.status");

		expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
		expect(response.error).toBeUndefined("response.error");

		expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
		expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
		expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
		expect(response.data.email).toBe(user.email, "response.data.email");
		expect(response.data.emailVerified).toBe(false, "response.data.emailVerified");
		expect(response.data.emailVerificationToken).toBeUndefined("response.data.emailVerificationToken");

		const userFromDatabase = await (db.collection(constants.collections.USERS).findOne({ id: response.data.id }));
		expect(userFromDatabase.emailVerified).toBe(false, "userFromDatabase.emailVerified");
		expect(userFromDatabase.emailVerificationToken).toBeDefined("userFromDatabase.emailVerificationToken");

		const roles = await roleManager.getRoles();

		user.roles.forEach(role => {
			expect(response.data.scopes.length).toBe(Object.keys(roles[role.toLowerCase()]).length);
		});
	});

	it("should not allow multiple users with the same email to be created", async done => {
		const user = mocks.getUserObject();
		await SpecUtils.createUser(user);

		try {
			await Promise.all([
				SpecUtils.createUser(user),
				SpecUtils.createUser(user),
				SpecUtils.createUser(user),
				SpecUtils.createUser(user),
				SpecUtils.createUser(user),
				SpecUtils.createUser(user),
				SpecUtils.createUser(user)
			]);

			done.fail();
		} catch (err) {
			expect(err.status).toBe(400, "err.status");

			expect(err.data).toBeUndefined("err.data");
			expect(Object.keys(err.error).length).not.toBe(0, "Object.keys(err.error).length");

			done();
		}
	});

	it("should be possible to create user with id", async () => {
		const userId = "5706ec69-0f4b-4af7-9bf2-e8e7fd0eacd6";

		const user = mocks.getUserObject();
		user.roles.push("super-admin");
		user.id = userId;

		const { status, data } = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		expect(status).toBe(201, "status");
		expect(data.id).toBe(userId, "data.id");
	});

	it("should resend verification mail when updating email if conf.requireEmailVerification is set to true and conf.emailVerificationTemplateByRole and config.requirePasswordOnEmailUpdate set", async () => {
		config.requireEmailVerification = true;
		config.requirePasswordOnEmailUpdate = true;
		config.emailVerificationTemplateByRole = "admin:596a3cee-21a2-4066-b169-9bd63579267d";

		const mockSendMailService = mocks.mockMailService();

		const { data: createdUser } = await testBus.request({
			subject: constants.endpoints.service.CREATE_USER,
			message: { data: mocks.getUserObject() }
		});

		await SpecUtils.delay(200);

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

	it("should be possible to create user without password if configure to send set password url", async () => {
		const mockSendMailService = mocks.mockMailService();

		const { password, ...user } = mocks.getUserObject();
		user.roles.push("super-admin");

		config.requireSendSetPasswordEmail = true;

		const { status, data } = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		await SpecUtils.delay(200);

		expect(status).toBe(201, "status");

		expect(data.firstName).toBe(user.firstName, "data.firstName");
		expect(data.middleName).toBe(user.middleName, "data.middleName");
		expect(data.lastName).toBe(user.lastName, "data.lastName");
		expect(data.email).toBe(user.email, "data.email");

		expect(mockSendMailService.invocations).toBe(1, "mockSendMailService.invocations");

		const requestData = mockSendMailService.requests[0].data;

		expect(requestData.to).toContain(user.email, "requestData.to");
	});

	it("should be possible to create user without password if configure to send set password url via email template", async () => {
		const mockSendMailService = mocks.mockMailService();

		const { password, ...user } = mocks.getUserObject();
		user.roles.push("super-admin");

		config.requireSendSetPasswordEmail = true;
		config.setPasswordEmailTemplate = "template1";

		const { status, data } = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

		await SpecUtils.delay(200);

		expect(status).toBe(201, "status");

		expect(data.firstName).toBe(user.firstName, "data.firstName");
		expect(data.middleName).toBe(user.middleName, "data.middleName");
		expect(data.lastName).toBe(user.lastName, "data.lastName");
		expect(data.email).toBe(user.email, "data.email");

		expect(mockSendMailService.invocations).toBe(1, "mockSendMailService.invocations");

		const requestData = mockSendMailService.requests[0].data;

		expect(requestData.to).toContain(user.email, "requestData.to");
		expect(requestData.templateId).toContain(config.setPasswordEmailTemplate, "requestData.templateId");
	});
});
