const testUtils = require("fruster-test-utils");
const userService = require("../fruster-user-service");
const bus = require("fruster-bus");
const UserRepo = require("../lib/repos/UserRepo");
const constants = require("../lib/constants");
const uuid = require("uuid");

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


	it("should fail to get ALL users when passing in empty object as query", (done) => {
		const req = {
			reqId: "reqId",
			data: {}
		};

		bus.request({
			subject: constants.endpoints.service.GET_USER,
			skipOptionsRequest: true,
			message: req
		})
			.then(res => {
				done.fail();
			})
			.catch(err => {
				expect(err.error.code).toBe("user-service.400.13");
				done();
			});
	});

	it("should fail to get ALL users when query is empty", (done) => {
		const req = {
			reqId: "reqId"
		};

		bus.request({
			subject: constants.endpoints.service.GET_USER,
			skipOptionsRequest: true,
			message: req
		})
			.then(res => {
				done.fail();
			})
			.catch(err => {
				expect(err.error.code).toBe("user-service.400.13");
				done();
			});
	});

	it("should fail to query by password", (done) => {
		const req = {
			reqId: "reqId",
			data: {
				password: "foo"
			}
		};

		bus.request({
			subject: constants.endpoints.service.GET_USER,
			skipOptionsRequest: true, message: req
		})
			.then(res => {
				done.fail();
			})
			.catch(err => {
				expect(err.error.code).toBe("user-service.400.13");
				done();
			});
	});

	it("should fail to query by salt", (done) => {
		const req = {
			reqId: "reqId",
			data: {
				salt: "foo"
			}
		};

		bus.request({
			subject: constants.endpoints.service.GET_USER,
			skipOptionsRequest: true,
			message: req
		})
			.then(res => {
				done.fail();
			})
			.catch(err => {
				expect(err.error.code).toBe("user-service.400.13");
				done();
			});
	});

	it("should get users by email", (done) => {
		const req = {
			reqId: "reqId",
			data: {
				email: "user1@example.com"
			}
		};

		bus.request({
			subject: constants.endpoints.service.GET_USER,
			skipOptionsRequest: true,
			message: req
		})
			.then(res => {
				expect(res.data.length).toBe(1);
				expect(res.data[0].id).toBe("user1");
				expect(res.data[0].password).toBeUndefined();
				done();
			});
	});

	it("should get users as admin using HTTP endpoint", (done) => {
		const req = {
			reqId: "reqId",
			query: {
				email: "user1@example.com"
			},
			user: {
				scopes: ["admin.*"]
			}
		};

		bus.request({
			subject: constants.endpoints.http.admin.GET_USERS,
			skipOptionsRequest: true,
			message: req
		})
			.then(res => {
				expect(res.data.length).toBe(1);
				expect(res.data[0].id).toBe("user1");
				expect(res.data[0].password).toBeUndefined();
				done();
			});
	});

	it("should get paginated users as admin using HTTP endpoint", (done) => {
		const req = {
			reqId: "reqId",
			query: {
				start: 1,
				limit: 2
			},
			user: {
				scopes: ["admin.*"]
			}
		};

		bus.request({
			subject: constants.endpoints.http.admin.GET_USERS,
			skipOptionsRequest: true,
			message: req
		})
			.then(res => {
				expect(res.data.length).toBe(2);
				expect(res.data[0].id).toBe("user1");
				expect(res.data[1].id).toBe("user2");
				done();
			});
	});

	it("should get internal server error if passing an invalid query", (done) => {
		const req = {
			reqId: "reqId",
			query: {
				$$$$: "$$$$"
			},
			user: {
				scopes: ["admin.*"]
			}
		};

		bus.request({
			subject: constants.endpoints.http.admin.GET_USERS,
			skipOptionsRequest: true,
			message: req
		})
			.catch(err => {
				expect(err.status).toBe(500);
				done();
			});
	});

	it("should return empty array when sending in faulty query/query without result", async done => {
		bus.request({
			subject: constants.endpoints.service.GET_USER,
			skipOptionsRequest: true,
			message: {
				reqId: uuid.v4(),
				data: { $or: [] }
			}
		})
			.then(res => {
				expect(res.data.length).toBe(0);
				done();
			});
	});

});


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