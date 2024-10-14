const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants");
const specConstants = require("./support/spec-constants");
const Db = require("mongodb").Db;
const config = require("../config");
const SpecUtils = require("./support/SpecUtils");


describe("GetUserByIdHandler", () => {

	/** @type {Db}] */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (connection) => {
				db = connection.db;
				await db.collection(constants.collections.USERS).deleteMany({});
			}));

	afterEach(() => SpecUtils.resetConfig());

	async function setupTestUsers() {
		await insertTestUsers(db);
	}

	it("should get 404 if user does not exist", async () => {
		try {
			await setupTestUsers();

			await SpecUtils.busRequest({
				subject: constants.endpoints.http.admin.GET_USER,
				data: {},
				user: { scopes: ["admin.*"] },
				params: { id: "non-existing-user-id" },
			});

			expect(true).toBe(false);
		} catch (err) {
			expect(err.status).toBe(404);
		}
	});

	it("should get user by id", async () => {
		await setupTestUsers();

		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.http.admin.GET_USER,
			data: {},
			user: { scopes: ["admin.*"] },
			params: { id: "user1" }
		});

		expect(res.status).toBe(200);
		expect(res.data.id).toBe("user1");
		expect(res.data.password).toBeUndefined();
	});

	it("should expand user if expand query is provided", async () => {
		config.userFields = ["isRelatedToSlatan"];

		const createdUsers = await createTestUsers();

		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.http.admin.GET_USER,
			data: {},
			user: { scopes: ["admin.*"] },
			params: { id: createdUsers[0].data.id },
			query: { expand: "profile" }
		});

		expect(res.status).toBe(200);
		expect(res.data.id).toBe(createdUsers[0].data.id);
		expect(res.data.profile.id).toBe(createdUsers[0].data.id);
		expect(res.data.password).toBeUndefined();
	});

	it("should not remove empty fields", async () => {
		await setupTestUsers();

		config.lowerCaseName = true;
		await insertTestUserWithEmptyLastName(db);

		const res = (await SpecUtils.busRequest(constants.endpoints.service.GET_USER, {
			id: "user1337"
		})).data[0];

		expect(res.id).toBe("user1337");
		expect(res.lastName).toBe("");
		expect(res.password).toBeUndefined();
	});

});

function insertTestUsers(db) {
	const users = ["user1", "user2"]
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

	return db.collection("users").insertMany(users);
}

function createTestUsers() {
	return Promise.all(["user1", "user2"]
		.map((username) => SpecUtils.createUser({
			id: username,
			firstName: `${username}-firstName`,
			lastName: `${username}-lastName`,
			email: `${username}@example.com`,
			salt: `${username}-salt`,
			roles: ["user"],
			password: "Localhost:8080"
		})));
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

	return db.collection("users").insertOne(user);
}
