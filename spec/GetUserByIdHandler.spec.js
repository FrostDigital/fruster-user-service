const testUtils = require("fruster-test-utils");
const userService = require("../fruster-user-service");
const bus = require("fruster-bus");
const UserRepo = require("../lib/repos/UserRepo");
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


	it("should get 404 if user does not exist", (done) => {
		const req = {
			reqId: "reqId",
			data: {},
			user: {
				scopes: ["admin.*"]
			},
			params: {
				id: "non-existing-user-id"
			}
		};

		bus.request({
			subject: constants.endpoints.http.admin.GET_USER,
			skipOptionsRequest: true,
			message: req
		})
			.then(res => {
				done.fail();
			})
			.catch(err => {
				expect(err.status).toBe(404);
				done();
			});
	});

	it("should get user by id", (done) => {
		const req = {
			reqId: "reqId",
			data: {},
			user: {
				scopes: ["admin.*"]
			},
			params: {
				id: "user1"
			}
		};

		bus.request({
			subject: constants.endpoints.http.admin.GET_USER,
			skipOptionsRequest: true,
			message: req
		})
			.then(res => {
				expect(res.status).toBe(200);
				expect(res.data.id).toBe("user1");
				expect(res.data.password).toBeUndefined();
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