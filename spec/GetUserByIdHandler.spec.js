const testUtils = require("fruster-test-utils");
const userService = require("../fruster-user-service");
const bus = require("fruster-bus");
const log = require("fruster-log");
const constants = require("../lib/constants");


describe("GetUserByIdHandler", () => {

	testUtils.startBeforeEach({
		mockNats: true,
		service: userService,
		bus: bus,
		mongoUrl: "mongodb://localhost:27017/fruster-user-service-test",
		afterStart: (connection) => {
			return insertTestUsers(connection.db);
		}
	});

	it("should get 404 if user does not exist", async done => {
		try {
			await bus.request({
				subject: constants.endpoints.http.admin.GET_USER,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: {},
					user: { scopes: ["admin.*"] },
					params: { id: "non-existing-user-id" }
				}
			});

			done.fail();
		} catch (err) {
			expect(err.status).toBe(404);
			done();
		}
	});

	it("should get user by id", async done => {
		try {
			const res = await bus.request({
				subject: constants.endpoints.http.admin.GET_USER,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					data: {},
					user: { scopes: ["admin.*"] },
					params: { id: "user1" }
				}
			});

			expect(res.status).toBe(200);
			expect(res.data.id).toBe("user1");
			expect(res.data.password).toBeUndefined();

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

});

function insertTestUsers(db) {
	let users = ["user1", "user2"]
		.map((username) => {
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