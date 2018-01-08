const testUtils = require("fruster-test-utils");
const userService = require("../fruster-user-service");
const bus = require("fruster-bus");
const log = require("fruster-log");
const constants = require("../lib/constants");
const uuid = require("uuid");
const Db = require("mongodb").Db;


describe("GetUserHandler", () => {

	testUtils.startBeforeEach({
		mockNats: true,
		service: userService,
		bus: bus,
		mongoUrl: "mongodb://localhost:27017/fruster-user-service-test",
		afterStart: (connection) => {
			return insertTestUsers(connection.db);
		}
	});

	it("should fail to get ALL users when passing in empty object as query", async done => {
		try {
			await bus.request({
				subject: constants.endpoints.service.GET_USER,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: {}
				}
			});

			done.fail();
		} catch (err) {
			expect(err.error.code).toBe("user-service.400.13", "err.error.code");
			done();
		}
	});

	it("should fail to get ALL users when query is empty", async done => {
		try {
			await bus.request({
				subject: constants.endpoints.service.GET_USER,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId"
				}
			});

			done.fail();
		} catch (err) {
			expect(err.error.code).toBe("user-service.400.13", "err.error.code");
			done();
		}
	});

	it("should fail to query by password", async done => {
		try {
			await bus.request({
				subject: constants.endpoints.service.GET_USER,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: { password: "foo" }
				}
			});

			done.fail();
		} catch (err) {
			expect(err.error.code).toBe("user-service.400.13", "err.error.code");
			done();
		}
	});

	it("should fail to query by salt", async done => {
		try {
			await bus.request({
				subject: constants.endpoints.service.GET_USER,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: { salt: "foo" }
				}
			});

			done.fail();
		} catch (err) {
			expect(err.error.code).toBe("user-service.400.13", "err.error.code");
			done();
		}
	});

	it("should get users by email", async done => {
		try {
			const res = await bus.request({
				subject: constants.endpoints.service.GET_USER,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: { email: "user1@example.com" }
				}
			});

			expect(res.data.length).toBe(1, "res.data.length");
			expect(res.data[0].id).toBe("user1", "res.data[0].id");
			expect(res.data[0].password).toBeUndefined("res.data[0].password");

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should get users as admin using HTTP endpoint", async done => {
		try {
			const res = await bus.request({
				subject: constants.endpoints.http.admin.GET_USERS,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					query: { email: "user1@example.com" },
					user: { scopes: ["admin.*"] }
				}
			});

			expect(res.data.length).toBe(1, "res.data.length");
			expect(res.data[0].id).toBe("user1", "res.data[0].id");
			expect(res.data[0].password).toBeUndefined("res.data[0].password");

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should get paginated users as admin using HTTP endpoint", async done => {
		try {
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

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
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

	it("should return empty array when sending in faulty query/query without result", async done => {
		try {
			const res = await bus.request({
				subject: constants.endpoints.service.GET_USER,
				skipOptionsRequest: true,
				message: {
					reqId: uuid.v4(),
					data: { $or: [] }
				}
			});

			expect(res.data.length).toBe(0, "res.data.length");

			done();
		} catch (err) {
			done.fail();
		}
	});

});

/**
 * @param {Db} db 
 */
function insertTestUsers(db) {
	let users = ["user1", "user2"].map((username) => {
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

	return db.collection("users").insert(users);
}