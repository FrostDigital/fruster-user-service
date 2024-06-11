const frusterTestUtils = require("fruster-test-utils");
const bus = require("fruster-bus");
const constants = require("../lib/constants");
const uuid = require("uuid");
const Db = require("mongodb").Db;
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");


describe("GetUserHandler", () => {

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => {
				return insertTestUsers(connection.db);
			}));

	it("should fail to get ALL users when passing in empty object as query", async done => {
		try {
			await SpecUtils.busRequest(constants.endpoints.service.GET_USER, {});

			done.fail();
		} catch (err) {
			expect(err.error.code).toBe("user-service.400.13", "err.error.code");
			done();
		}
	});

	it("should fail to get ALL users when query is empty", async () => {
		try {
			// @ts-ignore
			await SpecUtils.busRequest(constants.endpoints.service.GET_USER);

			fail();
		} catch (err) {
			expect(err.error.code).toBe("user-service.400.13", "err.error.code");
		}
	});

	it("should fail to query by password", async done => {
		try {
			await SpecUtils.busRequest(constants.endpoints.service.GET_USER, {
				password: "foo"
			});

			done.fail();
		} catch (err) {
			expect(err.error.code).toBe("user-service.400.13", "err.error.code");
			done();
		}
	});

	it("should fail to query by salt", async done => {
		try {
			await SpecUtils.busRequest(constants.endpoints.service.GET_USER, {
				salt: "foo"
			});

			done.fail();
		} catch (err) {
			expect(err.error.code).toBe("user-service.400.13", "err.error.code");
			done();
		}
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
					start: 1,
					limit: 2
				},
				user: { scopes: ["admin.*"] }
			}
		});

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
		});

		expect(res.data.length).toBe(1, "res.data.length");
		expect(res.data[0].id).toBe("user1", "res.data[0].id");
	});

	it("should get internal server error if passing an invalid query", async done => {
		try {
			await bus.request({
				subject: constants.endpoints.http.admin.GET_USERS,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					query: { $$$$: "$$$$" },
					user: { scopes: ["admin.*"] }
				}
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(500, "err.status");
			done();
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
		});

		expect(res.data.length).toBe(0, "res.data.length");
	});

});

/**
 * @param {Db} db
 */
function insertTestUsers(db) {
	const users = ["user1", "user2"].map((username) => {
		return {
			id: username,
			firstName: `${username}-firstName`,
			lastName: `${username}-lastName`,
			email: `${username}@example.com`,
			salt: `${username}-salt`,
			roles: ["user"],
			password: username
		}
	});

	return db.collection("users").insertMany(users);
}
