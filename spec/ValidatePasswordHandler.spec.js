const Db = require("mongodb").Db;
const config = require('../config');
const mocks = require('./support/mocks.js');
const errors = require('../lib/errors.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");
const deprecatedErrors = require("../lib/deprecatedErrors");


describe("ValidatePasswordHandler", () => {

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => db = connection.db));

	afterEach(() => SpecUtils.resetConfig());

	it("should return 200 when validating correct password", async () => {
		const user = mocks.getUserObject();

		//@ts-ignore
		await db.dropDatabase(constants.collections.USERS);

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.CREATE_USER,
			data: user
		});

		const response = await SpecUtils.busRequest({
			subject: constants.endpoints.service.VALIDATE_PASSWORD,
			data: { username: user.email, password: user.password }
		});

		expect(response.status).toBe(200, "response.status");
		expect(response.error).toBeUndefined("response.error");
	});

	it("should be possible to login using different `usernameValidationDbField`", async () => {
		/** NOTE: never use firstName as usernameValidationDbField in a live scenario, it's a really bad idea! 😅*/
		config.usernameValidationDbField = ["username", "email", "firstName"];

		const user = { ...mocks.getUserObject(), username: "1337" };

		//@ts-ignore
		await db.dropDatabase(constants.collections.USERS);

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.CREATE_USER,
			data: user
		});

		const { status: usernameResp } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.VALIDATE_PASSWORD,
			data: { username: user.email, password: user.password }
		});

		expect(usernameResp).toBe(200, "email login status");

		const { status: emailResp } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.VALIDATE_PASSWORD,
			data: { username: user.username, password: user.password }
		});

		expect(emailResp).toBe(200, "firstName login status");

		const { status: firstNameResp } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.VALIDATE_PASSWORD,
			data: { username: user.firstName, password: user.password }
		});

		expect(firstNameResp).toBe(200, "username login status");
	});

	it("should not be possible to login using incorrect login details with multiple `usernameValidationDbField`", async () => {
		/** NOTE: never use firstName as usernameValidationDbField in a live scenario, it's a really bad idea! 😅*/
		config.usernameValidationDbField = ["username", "email", "firstName"];

		const user = { ...mocks.getUserObject(), username: "1337" };

		//@ts-ignore
		await db.dropDatabase(constants.collections.USERS);

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.CREATE_USER,
			data: user
		});

		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.VALIDATE_PASSWORD,
				data: { username: user.email, password: "NEI" }
			});
		} catch ({ status, error: { code } }) {
			expect(status).toBe(401, "email login status");
			expect(code).toBe(deprecatedErrors.errorCodes.invalidUsernameOrPassword);
		}

		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.VALIDATE_PASSWORD,
				data: { username: user.username, password: "NEI" }
			});
		} catch ({ status, error: { code } }) {
			expect(status).toBe(401, "firstName login status");
			expect(code).toBe(deprecatedErrors.errorCodes.invalidUsernameOrPassword);
		}

		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.VALIDATE_PASSWORD,
				data: { username: user.firstName, password: "NEI" }
			});
		} catch ({ status, error: { code } }) {
			expect(status).toBe(401, "username login status");
			expect(code).toBe(deprecatedErrors.errorCodes.invalidUsernameOrPassword);
		}
	});

	it("should return 200 when validating correct password without hashDate", async () => {
		const user = mocks.getOldUserObject();

		//@ts-ignore
		await db.dropDatabase(constants.collections.USERS);

		await db.collection(constants.collections.USERS).update({ id: user.id }, user, { upsert: true })

		const response = await SpecUtils.busRequest({
			subject: constants.endpoints.service.VALIDATE_PASSWORD,
			data: { username: user.email, password: config.initialUserPassword }
		});

		expect(response.status).toBe(200, "response.status");
		expect(response.error).toBeUndefined("response.error");
	});

	it("should return 200 when validating correct password old hashDate", async () => {
		const user = mocks.getOldUserObject();

		user.hashDate = new Date("1970");

		//@ts-ignore
		await db.dropDatabase(constants.collections.USERS);

		await db.collection(constants.collections.USERS).update({ id: user.id }, user, { upsert: true })

		const response = await SpecUtils.busRequest({
			subject: constants.endpoints.service.VALIDATE_PASSWORD,
			data: { username: user.email, password: config.initialUserPassword }
		});

		expect(response.status).toBe(200, "response.status");
		expect(response.error).toBeUndefined("response.error");
	});

	it("should be possible to login with non case sensitive username", async () => {
		const user = mocks.getUserObject();
		user.email = "urban@hello.se";

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.CREATE_USER,
			data: user
		});

		const response = await SpecUtils.busRequest({
			subject: constants.endpoints.service.VALIDATE_PASSWORD,
			data: { username: "UrbAn@HeLlO.se", password: user.password }
		});

		expect(response.status).toBe(200, "response.status");
		expect(response.error).toBeUndefined("response.error");
	});

	it("should return 401 when validating incorrect password", async done => {
		const user = mocks.getUserObject();

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.CREATE_USER,
			data: user
		});

		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.VALIDATE_PASSWORD,
				data: { username: user.email, password: "yoyoyo" }
			});
		} catch (err) {
			expect(err.status).toBe(401, "err.status");
			expect(err.data).toBeUndefined("err.data");

			done();
		}
	});

	it("should not be possible to login using an incomplete email", async done => {
		mocks.mockMailService();

		const user = mocks.getUserObject();

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.CREATE_USER,
			data: user
		});

		let email = user.email;
		email = email.substring(0, email.indexOf("@"));

		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.VALIDATE_PASSWORD,
				data: { username: email, password: user.password }
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(401, "err.status");
			expect(err.data).toBeUndefined("err.data");

			done();
		}
	});

	it("should return 400 when user without verified email logs in with config.requireEmailVerification set to true", async done => {
		mocks.mockMailService();

		config.requireEmailVerification = true;

		const user = mocks.getUserObject();

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.CREATE_USER,
			data: user
		});

		await SpecUtils.delay(200);

		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.VALIDATE_PASSWORD,
				data: { username: user.email, password: user.password }
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(400, "err.status");
			expect(err.error.code).toBe(errors.get("fruster-user-service.EMAIL_NOT_VERIFIED").error.code, "err.error.code");

			config.requireEmailVerification = false;

			done();
		}
	});

	it("should be possible for to login even if the email has not been verified but config.optionalEmailVerification is set to true", async () => {
		const user = mocks.getUserObject();

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.CREATE_USER,
			data: user
		});

		config.optionalEmailVerification = true;

		const response = await SpecUtils.busRequest({
			subject: constants.endpoints.service.VALIDATE_PASSWORD,
			data: { username: user.email, password: user.password }
		});

		expect(response.status).toBe(200, "response.status");
		expect(response.error).toBeUndefined("response.error");

		config.optionalEmailVerification = false;
	});

	it("should be possible for old accounts to login even if the email has not been verified", async () => {
		const user = mocks.getUserObject();

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.CREATE_USER,
			data: user
		});

		config.requireEmailVerification = true;

		const response = await SpecUtils.busRequest({
			subject: constants.endpoints.service.VALIDATE_PASSWORD,
			data: { username: user.email, password: user.password }
		});

		expect(response.status).toBe(200, "response.status");
		expect(response.error).toBeUndefined("response.error");

		config.requireEmailVerification = false;
	});

	it("should return 200 when validating correct password with additional query", async () => {
		const user = mocks.getUserObject();

		const orgId = "org-id";

		//@ts-ignore
		await db.dropDatabase(constants.collections.USERS);

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.CREATE_USER,
			data: { ...user, organisation: { id: orgId } }
		});

		const { status, data, error } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.VALIDATE_PASSWORD,
			data: {
				username: user.email,
				password: user.password,
				additionalQuery: { "organisation.id": orgId }
			}
		});

		expect(status).toBe(200, "status");
		expect(error).toBeUndefined("error");
	});

});
