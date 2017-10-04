const testUtils = require("fruster-test-utils");
const userService = require("../fruster-user-service");
const bus = require("fruster-bus");
const UserRepo = require("../lib/repos/UserRepo");

describe("UserRepo", () => {
	
	let userRepo;

	testUtils.startBeforeEach({
		mockNats: true,
		service: userService,
		bus: bus,
		mongoUrl: "mongodb://localhost:27017/fruster-user-service-test",
		afterStart: (connection) => {			
			userRepo = new UserRepo(connection.db);
			return insertTestUsers(connection.db);
		}
	});

	it("should get user by id", (done) => {
		userRepo.getById("user1").then((user) => {
			expect(user.id).toBe("user1");
			expect(user._id).toBeUndefined();
			expect(user.firstName).toBe("user1-firstName");
			expect(user.lastName).toBe("user1-lastName");
			done();
		});
	});

	it("should not get non existing user by id", (done) => {
		userRepo.getById("user666").then((user) => {
			expect(user).toBeFalsy();		
			done();
		});
	});

	it("should get all users", (done) => {
		userRepo.getUsers().then((users) => {
			expect(users.length).toBe(3); // user1 + user2 + initial users = 3			
			done();
		});
	});

	it("should get users by query", (done) => {
		userRepo.getUsers({email: "user1@example.com"}).then((users) => {
			expect(users.length).toBe(1);
			expect(users[0]._id).toBeUndefined();
			done();
		});
	});

});


function insertTestUsers(db) {
	let users = ["user1", "user2"].map((username) => {
		return {
			id: username,
			firstName: username + "-firstName",
			lastName: username + "-lastName",
			email: `${username}@example.com`
		}
	});

	return db.collection("users").insert(users);	
}