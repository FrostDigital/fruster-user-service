import frusterTestUtils from "@fruster/test-utils";
import bus from "@fruster/bus";
import constants from "../lib/constants";
import * as uuid from "uuid";
import { Db } from "mongodb";
import specConstants from "./support/spec-constants";
import SpecUtils from "./support/SpecUtils";


describe("GetUserHandler", () => {

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => {
				await connection.db.collection(constants.collections.USERS).deleteMany({});
				await insertTestUsers(connection.db);
			}));

	it("should fail to get ALL users when passing in empty object as query", async () => {
		const err: any = await SpecUtils.busRequestExpectError(constants.endpoints.service.GET_USER, {});
		expect(err.error.code).toBe("user-service.400.13", "err.error.code");
	});

	it("should fail to get ALL users when query is empty", async () => {
		const err: any = await SpecUtils.busRequestExpectError(constants.endpoints.service.GET_USER);
		expect(err.error.code).toBe("user-service.400.13", "err.error.code");
	});

	it("should fail to query by password", async () => {
		const err: any = await SpecUtils.busRequestExpectError(constants.endpoints.service.GET_USER, {
			password: "foo"
		});

		expect(err.error.code).toBe("user-service.400.13", "err.error.code");
	});

	it("should fail to query by salt", async () => {
		const err: any = await SpecUtils.busRequestExpectError(constants.endpoints.service.GET_USER, {
			salt: "foo"
		});

		expect(err.error.code).toBe("user-service.400.13", "err.error.code");
	});

	it("should get users by email", async () => {
		const res = await SpecUtils.busRequest(constants.endpoints.service.GET_USER, {
			email: "user1@example.com"
		});

		expect(res.data.length).toBe(1, "res.data.length");
		expect(res.data[0].id).toBe("user1", "res.data[0].id");
		expect(res.data[0].password).toBeUndefined("res.data[0].password");
	});

	it("should get users as admin using HTTP endpoint", async () => {
		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.http.admin.GET_USERS,
			user: {
				scopes: ["admin.*"]
			},
			query: {
				email: "user1@example.com"
			}
		});

		expect(res.data.length).toBe(1, "res.data.length");
		expect(res.data[0].id).toBe("user1", "res.data[0].id");
		expect(res.data[0].password).toBeUndefined("res.data[0].password");
	});

	it("should get paginated users as admin using HTTP endpoint", async () => {
		const res = await bus.request({
			subject: constants.endpoints.http.admin.GET_USERS,
			skipOptionsRequest: true,
			message: {
				reqId: "reqId",
				query: {
					start: 0,
					limit: 2
				},
				user: { scopes: ["admin.*"] }
			}
		} as any);

		expect(res.data.length).toBe(2, "res.data.length");
		expect(res.data[0].id).toBe("user1", "res.data[0].id");
		expect(res.data[1].id).toBe("user2", "res.data[1].id");
	});

	it("should search for user HTTP endpoint", async () => {
		const res = await bus.request({
			subject: constants.endpoints.http.admin.GET_USERS,
			skipOptionsRequest: true,
			message: {
				reqId: "reqId",
				query: {
					searchField: "email",
					searchValue: "user1",
				},
				user: { scopes: ["admin.*"] }
			}
		} as any);

		expect(res.data.length).toBe(1, "res.data.length");
		expect(res.data[0].id).toBe("user1", "res.data[0].id");
	});

	it("should get internal server error if passing an invalid query", async () => {
		try {
			await bus.request({
				subject: constants.endpoints.http.admin.GET_USERS,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					query: { $$$$: "$$$$" },
					user: { scopes: ["admin.*"] }
				}
			} as any);
			fail();
		} catch (err: any) {
			expect(err.status).toBe(500, "err.status");
		}
	});

	it("should return empty array when sending in faulty query/query without result", async () => {
		const res = await bus.request({
			subject: constants.endpoints.service.GET_USER,
			skipOptionsRequest: true,
			message: {
				reqId: uuid.v4(),
				data: { $or: [] }
			}
		} as any);

		expect(res.data.length).toBe(0, "res.data.length");
	});

});

function insertTestUsers(db: Db) {
	const users = ["user1", "user2"].map((username) => {
		return {
			id: username,
			firstName: `${username}-firstName`,
			lastName: `${username}-lastName`,
			email: `${username}@example.com`,
			salt: `${username}-salt`,
			roles: ["user"],
			password: username
		};
	});

	return db.collection("users").insertMany(users);
}
