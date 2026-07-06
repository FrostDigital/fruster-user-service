import { Db } from "mongodb";
import frusterTestUtils from "@fruster/test-utils";
import mocks from "./support/mocks";
import SpecUtils from "./support/SpecUtils";
import specConstants from "./support/spec-constants";
import config from "../config";
import constants from "../lib/constants";
import { errors } from "@fruster/bus";


describe("SetPasswordHandler", () => {

	let db: Db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => { db = connection.db; }));

	afterEach(() => SpecUtils.resetConfig());

	it("should be possible to set password", async () => {
		const user = mocks.getUserObject();
		const { data } = await SpecUtils.createUser(user);

		const oldUser: any = await db.collection("users").findOne({ id: data.id });

		await SpecUtils.busRequest({
			subject: constants.endpoints.service.SET_PASSWORD,
			user: data,
			data: {
				newPassword: "Localhost:8081",
				id: data.id
			}
		});

		const newUser: any = await db.collection("users").findOne({ id: data.id });

		expect(newUser.password).not.toBe(oldUser.password, "newUser.password");
		expect(newUser.salt).not.toBe(oldUser.salt, "newUser.salt");
		expect(newUser.hashDate).not.toBe(oldUser.hashDate, "newUser.hashDate");
	});

	it("should be possible to set password with token", async () => {
		const sendMockMailService = mocks.mockMailService();
		const { password, ...user }: any = mocks.getUserObject();
		user.roles.push("super-admin");

		config.requireSendSetPasswordEmail = true;

		const { data } = await SpecUtils.createUser(user);

		await SpecUtils.delay(200);

		const token = getToken(sendMockMailService.requests[0].data.message);

		const { status } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.SET_PASSWORD,
			data: {
				newPassword: "Localhost:8081",
				token
			}
		});

		expect(status).toBe(202, "status");

		const newUser: any = await db.collection("users").findOne({ id: data.id });

		expect(newUser.password).toBeDefined("newUser.password");
		expect(newUser.salt).toBeDefined("newUser.salt");
		expect(newUser.hashDate).toBeDefined("newUser.hashDate");
	});

	it("should throw bad request error if id or token not found", async () => {
		const { status, error } = await SpecUtils.busRequestExpectError({
			subject: constants.endpoints.service.SET_PASSWORD,
			data: {
				newPassword: "Localhost:8081"
			}
		});

		expect(status).toBe(400, "status");
		expect(error.code).toBe(errors.badRequest().error.code, "error.code");
		expect(error.detail).toBe("The request need id or token", "error.detail");
	});

	it("should throw not found error if id or token not found", async () => {
		const { status, error } = await SpecUtils.busRequestExpectError({
			subject: constants.endpoints.service.SET_PASSWORD,
			data: {
				newPassword: "Localhost:8081",
				token: "not-found"
			}
		});

		expect(status).toBe(404, "status");
		expect(error.code).toBe(errors.notFound().error.code, "error.code");

	});

	function getToken(message: string) {
		const splices = message.split(" ");

		let url = "";
		const search = "http://localhost:3120/set-password?token=";

		for (const splice of splices)
			if (splice.includes(search)) {
				url = splice;
				break;
			}

		return url.replace(search, "");
	}

});
