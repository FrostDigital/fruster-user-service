import frusterTestUtils from "@fruster/test-utils";
import UserRepo from "../lib/repos/UserRepo";
import { Db } from "mongodb";
import specConstants from "./support/spec-constants";
import constants from "../lib/constants";

const { collections } = constants;

describe("UserRepo", () => {

	let userRepo: UserRepo;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => {
				await connection.db.collection(collections.USERS).deleteMany({});
				userRepo = new UserRepo(connection.db);
				await insertTestUsers(connection.db);
			}));

	it("should get user by id", async () => {
		const user = await userRepo.getById("user1");

		expect(user.id).toBe("user1");
		expect((user as any)._id).toBeUndefined();
		expect(user.firstName).toBe("user1-firstName");
		expect(user.lastName).toBe("user1-lastName");
	});

	it("should not get non existing user by id", async () => {
		const user = await userRepo.getById("user666");
		expect(user).toBeFalsy();
	});

	it("should get all users", async () => {
		const [users] = await userRepo.getUsersByQuery({});
		expect(users.length).toBe(2); // user1 + user2
	});

	it("should get users by query", async () => {
		const [users] = await userRepo.getUsersByQuery({ query: { email: "user1@example.com" } });

		expect(users.length).toBe(1);
		expect((users[0] as any)._id).toBeUndefined();
	});

});

function insertTestUsers(db: Db) {
	const users = ["user1", "user2"]
		.map((username) => {
			return {
				id: username,
				firstName: username + "-firstName",
				lastName: username + "-lastName",
				email: `${username}@example.com`
			};
		});

	return db.collection("users").insertMany(users);
}
