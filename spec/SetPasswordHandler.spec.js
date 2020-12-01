const frusterTestUtils = require("fruster-test-utils");
const mocks = require('./support/mocks.js');
const SpecUtils = require('./support/SpecUtils');
const specConstants = require("./support/spec-constants");
const config = require('../config.js');
const constants = require('../lib/constants.js');
const errors = require("../lib/errors.js");


describe("SetPasswordHandler", () => {

	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => { db = connection.db; }));

	afterEach(() => SpecUtils.resetConfig());

	it("should be possible to set password", async () => {
		const user = mocks.getUserObject();
		const { data } = await SpecUtils.createUser(user);

		const oldUser = await db.collection("users").findOne({ id: data.id });

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.SET_PASSWORD,
			user: data,
			data: {
				newPassword: "Localhost:8081",
				id: data.id
			}
		});

		const newUser = await db.collection("users").findOne({ id: data.id });

		expect(newUser.password).not.toBe(oldUser.password, "newUser.password");
		expect(newUser.salt).not.toBe(oldUser.salt, "newUser.salt");
		expect(newUser.hashDate).not.toBe(oldUser.hashDate, "newUser.hashDate");
	});

	it("should be possible to set password with token", async () => {
		mocks.mockMailService();
		const { password, ...user } = mocks.getUserObject();
		user.roles.push("super-admin");

		config.requireSendSetPasswordEmail = true;

		const { data } = await SpecUtils.createUser(user);

		await SpecUtils.delay(200);

		const { status } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.SET_PASSWORD,
			data: {
				newPassword: "Localhost:8081",
				token: data.setPasswordToken
			}
		});

		expect(status).toBe(202, "status");

		const newUser = await db.collection("users").findOne({ id: data.id });

		expect(newUser.password).toBeDefined("newUser.password");
		expect(newUser.salt).toBeDefined("newUser.salt");
		expect(newUser.hashDate).toBeDefined("newUser.hashDate");
	});

	it("should throw bad request error if id or token not found", async done => {
		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.SET_PASSWORD,
				data: {
					newPassword: "Localhost:8081"
				}
			});

			done.fail();
		} catch ({ status, error }) {
			expect(status).toBe(400, "status");
			expect(error.code).toBe(errors.badRequest().error.code, "error.code");
			expect(error.detail).toBe("The request need id or token", "error.detail");
			done();
		}
	});

	it("should throw not found error if id or token not found", async done => {
		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.SET_PASSWORD,
				data: {
					newPassword: "Localhost:8081",
					token: "not-found"
				}
			});

			done.fail();
		} catch ({ status, error }) {
			expect(status).toBe(404, "status");
			expect(error.code).toBe(errors.notFound().error.code, "error.code");
			done();
		}
	});

});
