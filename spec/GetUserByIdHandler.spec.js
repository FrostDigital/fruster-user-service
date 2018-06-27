const frusterTestUtils = require("fruster-test-utils");
const bus = require("fruster-bus");
const log = require("fruster-log");
const constants = require("../lib/constants");
const specConstants = require("./support/spec-constants");
const Db = require("mongodb").Db;
const config = require("../config");


describe("GetUserByIdHandler", () => {

	/** @type {Db}] */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => { db = connection.db; return insertTestUsers(connection.db); }));

	afterEach(() => config.lowerCaseName = false);

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

	it("should not remove empty fields", async done => {
		try {
			config.lowerCaseName = true;
			await insertTestUserWithEmptyLastName(db);

			const userFromDb = await db.collection(constants.collections.USERS).findOne({ id: "user1337" });

			const res = (await bus.request({
				subject: constants.endpoints.service.GET_USER,
				skipOptionsRequest: true,
				message: {
					reqId: "reqId",
					user: { scopes: ["admin.*"] },
					data: { id: "user1337" }
				}
			})).data[0];

			expect(res.id).toBe("user1337");
			expect(res.lastName).toBe("");
			expect(res.password).toBeUndefined();

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

function insertTestUserWithEmptyLastName(db) {
	const user = {
		id: "user1337",
		firstName: "user1337-firstName",
		lastName: "",
		email: "user1337@example.com",
		salt: "user1337-salt",
		roles: ["user"],
		password: "user1337"
	}

	return db.collection("users").insert(user);
}