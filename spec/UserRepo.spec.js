const frusterTestUtils = require("fruster-test-utils");
const userService = require("../fruster-user-service");
const bus = require("fruster-bus");
const log = require("fruster-log");
const UserRepo = require("../lib/repos/UserRepo");
const Db = require("mongodb").Db;
const specConstants = require("./support/spec-constants");


describe("UserRepo", () => {

	/**@type {UserRepo} */
	let userRepo;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => {
				userRepo = new UserRepo(connection.db);
				return insertTestUsers(connection.db);
			}));

	it("should get user by id", async done => {
		try {
			const user = await userRepo.getById("user1");

			expect(user.id).toBe("user1");
			expect(user._id).toBeUndefined();
			expect(user.firstName).toBe("user1-firstName");
			expect(user.lastName).toBe("user1-lastName");

			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should not get non existing user by id", async done => {
		try {
			const user = await userRepo.getById("user666");
			expect(user).toBeFalsy();
			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should get all users", async done => {
		try {
			let users;
			[users] = await userRepo.getUsersByQuery();

			expect(users.length).toBe(3); // user1 + user2 + initial users = 3			
			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

	it("should get users by query", async done => {
		try {
			let users;
			[users] = await userRepo.getUsersByQuery({ email: "user1@example.com" });
			expect(users.length).toBe(1);
			expect(users[0]._id).toBeUndefined();
			done();
		} catch (err) {
			log.error(err);
			done.fail(err);
		}
	});

});

/**
 * @param {Db} db 
 */
function insertTestUsers(db) {
	let users = ["user1", "user2"]
		.map((username) => {
			return {
				id: username,
				firstName: username + "-firstName",
				lastName: username + "-lastName",
				email: `${username}@example.com`
			}
		});

	return db.collection("users").insert(users);
}