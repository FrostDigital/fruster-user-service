const frusterTestUtils = require("fruster-test-utils")
const constants = require("../lib/constants");
const Db = require("mongodb").Db;
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");
const config = require("../config");


describe("GetUsersByQueryHandler", () => {

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(connection => db = connection.db));

	afterEach(() => SpecUtils.resetConfig());

	it("should be possible to get users by a simple query", async () => {
		await insertTestUsers(10);

		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: { roles: { $in: ["user"] } }
			}
		});

		expect(res.data.users.length).toBe(10, "res.data.users.length");
		expect(res.data.totalCount).toBe(10, "res.data.totalCount");

		for (let i = 0; i < 10; i++) {
			expect(res.data.users[i].id).toBe(`user${i}`, "res.data.users[i].id");
			expect(res.data.users[i].password).toBeUndefined("res.data.users[i].password");
			expect(res.data.users[i].salt).toBeUndefined("res.data.users[i].salt");
		}
	});

	it("should be possible to get users by a query with expanded profile", async () => {
		config.userFields = [constants.dataset.REQUIRED_ONLY];
		await createTestUsers(10);

		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: { roles: { $in: ["user"] } },
				expand: "profile",
				sort: { "profile.firstName": 1 }
			}
		});

		expect(res.data.users.length).toBe(10, "res.data.users.length");
		expect(res.data.totalCount).toBe(10, "res.data.totalCount");

		for (let i = 0; i < 10; i++) {
			expect(res.data.users[i].id).toBeDefined("res.data.users[i].id");
			expect(res.data.users[i].password).toBeUndefined("res.data.users[i].password");
			expect(res.data.users[i].salt).toBeUndefined("res.data.users[i].salt");
			expect(res.data.users[i].profile).toBeDefined("res.data.users[i].profile");
			expect(res.data.users[i].profile.firstName).toBe(`user${i}-firstName`, "res.data.users[i].profile.firstName");
			expect(res.data.users[i].profile.lastName).toBe(`user${i}-lastName`, "res.data.users[i].profile.lastName");
			expect(res.data.users[i].profile.customField).toBe(Math.cos(i), "res.data.users[i].profile.customField");

			expect(res.data.users[i].metadata).toBeDefined("res.data.users[i].profile.metadata");
			expect(res.data.users[i].metadata.created).toBeDefined("res.data.users[i].profile.metadata.created");
			expect(res.data.users[i].metadata.updated).toBeDefined("res.data.users[i].profile.metadata.updated");
			expect(res.data.users[i].profile.metadata).toBeDefined("res.data.users[i].profile.metadata");
			expect(res.data.users[i].profile.metadata.created).toBeDefined("res.data.users[i].profile.metadata.created");
			expect(res.data.users[i].profile.metadata.updated).toBeDefined("res.data.users[i].profile.metadata.updated");
		}
	});

	it("should be possible to get users by a query with expanded profile with just query", async () => {
		config.userFields = [constants.dataset.REQUIRED_ONLY];
		await createTestUsers(10);

		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: { roles: { $in: ["user"] } },
				expand: "profile"
			}
		});

		expect(res.data.users.length).toBe(10, "res.data.users.length");
		expect(res.data.totalCount).toBe(10, "res.data.totalCount");

		for (let i = 0; i < 10; i++) {
			expect(res.data.users[i].id).toBeDefined("res.data.users[i].id");
			expect(res.data.users[i].password).toBeUndefined("res.data.users[i].password");
			expect(res.data.users[i].salt).toBeUndefined("res.data.users[i].salt");
			expect(res.data.users[i].profile).toBeDefined("res.data.users[i].profile");
			expect(res.data.users[i].profile.firstName).toBe(`user${i}-firstName`, "res.data.users[i].profile.firstName");
			expect(res.data.users[i].profile.lastName).toBe(`user${i}-lastName`, "res.data.users[i].profile.lastName");
			expect(res.data.users[i].profile.customField).toBe(Math.cos(i), "res.data.users[i].profile.customField");

			expect(res.data.users[i].metadata).toBeDefined("res.data.users[i].profile.metadata");
			expect(res.data.users[i].metadata.created).toBeDefined("res.data.users[i].profile.metadata.created");
			expect(res.data.users[i].metadata.updated).toBeDefined("res.data.users[i].profile.metadata.updated");
			expect(res.data.users[i].profile.metadata).toBeDefined("res.data.users[i].profile.metadata");
			expect(res.data.users[i].profile.metadata.created).toBeDefined("res.data.users[i].profile.metadata.created");
			expect(res.data.users[i].profile.metadata.updated).toBeDefined("res.data.users[i].profile.metadata.updated");
		}
	});

	it("should be possible to get users by a query with expanded profile included in query", async () => {
		config.userFields = [constants.dataset.REQUIRED_ONLY];
		await createTestUsers(10);

		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: {
					roles: { $in: ["user"] },
					"profile.firstName": "user7-firstName"
				},
				expand: "profile",
				sort: { "profile.firstName": 1 }
			}
		});

		expect(res.data.users.length).toBe(1, "res.data.users.length");
		expect(res.data.totalCount).toBe(1, "res.data.totalCount");

		expect(res.data.users[0].id).toBeDefined("res.data.users[0].id");
		expect(res.data.users[0].password).toBeUndefined("res.data.users[0].password");
		expect(res.data.users[0].salt).toBeUndefined("res.data.users[0].salt");
		expect(res.data.users[0].profile).toBeDefined("res.data.users[0].profile");
		expect(res.data.users[0].profile.firstName).toBe(`user7-firstName`, "res.data.users[0].profile.firstName");
		expect(res.data.users[0].profile.lastName).toBe(`user7-lastName`, "res.data.users[0].profile.lastName");
		expect(res.data.users[0].profile.customField).toBe(Math.cos(7), "res.data.users[0].profile.customField");

		expect(res.data.users[0].metadata).toBeDefined("res.data.users[0].profile.metadata");
		expect(res.data.users[0].metadata.created).toBeDefined("res.data.users[0].profile.metadata.created");
		expect(res.data.users[0].metadata.updated).toBeDefined("res.data.users[0].profile.metadata.updated");
		expect(res.data.users[0].profile.metadata).toBeDefined("res.data.users[0].profile.metadata");
		expect(res.data.users[0].profile.metadata.created).toBeDefined("res.data.users[0].profile.metadata.created");
		expect(res.data.users[0].profile.metadata.updated).toBeDefined("res.data.users[0].profile.metadata.updated");
	});

	it("should be possible to get users by a query with expanded profile included in query and filter result", async () => {
		config.userFields = [constants.dataset.REQUIRED_ONLY];
		await createTestUsers(10);

		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: {
					roles: { $in: ["user"] },
					"profile.firstName": "user7-firstName"
				},
				expand: "profile",
				sort: {
					"profile.firstName": 1
				},
				filter: {
					id: 1,
					"profile.firstName": 1
				}
			}
		});

		expect(res.data.users.length).toBe(1, "res.data.users.length");
		expect(res.data.totalCount).toBe(1, "res.data.totalCount");

		expect(res.data.users[0].id).toBeDefined("res.data.users[0].id");
		expect(res.data.users[0].password).toBeUndefined("res.data.users[0].password");
		expect(res.data.users[0].salt).toBeUndefined("res.data.users[0].salt");
		expect(res.data.users[0].profile).toBeDefined("res.data.users[0].profile");
		expect(res.data.users[0].profile.firstName).toBe(`user7-firstName`, "res.data.users[0].profile.firstName");
		expect(res.data.users[0].profile.lastName).toBeUndefined("res.data.users[0].profile.lastName");
		expect(res.data.users[0].profile.customField).toBeUndefined("res.data.users[0].profile.customField");

		expect(res.data.users[0].metadata).toBeUndefined("res.data.users[0].profile.metadata");
		expect(res.data.users[0].profile.metadata).toBeUndefined("res.data.users[0].profile.metadata");
	});

	it("should be possible to get users by a query with expanded profile included in query and limit result", async () => {
		config.userFields = [constants.dataset.REQUIRED_ONLY];
		await createTestUsers(10);

		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: {
					roles: { $in: ["user"] },
					"profile.firstName": { $exists: true }
				},
				expand: "profile",
				sort: { "profile.firstName": 1 },
				limit: 2
			}
		});

		expect(res.data.users.length).toBe(2, "res.data.users.length");
		expect(res.data.totalCount).toBe(10, "res.data.totalCount");

		for (let i = 0; i < 2; i++) {
			expect(res.data.users[i].id).toBeDefined("res.data.users[i].id");
			expect(res.data.users[i].password).toBeUndefined("res.data.users[i].password");
			expect(res.data.users[i].salt).toBeUndefined("res.data.users[i].salt");
			expect(res.data.users[i].profile).toBeDefined("res.data.users[i].profile");
			expect(res.data.users[i].profile.firstName).toBe(`user${i}-firstName`, "res.data.users[i].profile.firstName");
			expect(res.data.users[i].profile.lastName).toBe(`user${i}-lastName`, "res.data.users[i].profile.lastName");
			expect(res.data.users[i].profile.customField).toBe(Math.cos(i), "res.data.users[i].profile.customField");

			expect(res.data.users[i].metadata).toBeDefined("res.data.users[i].profile.metadata");
			expect(res.data.users[i].metadata.created).toBeDefined("res.data.users[i].profile.metadata.created");
			expect(res.data.users[i].metadata.updated).toBeDefined("res.data.users[i].profile.metadata.updated");
			expect(res.data.users[i].profile.metadata).toBeDefined("res.data.users[i].profile.metadata");
			expect(res.data.users[i].profile.metadata.created).toBeDefined("res.data.users[i].profile.metadata.created");
			expect(res.data.users[i].profile.metadata.updated).toBeDefined("res.data.users[i].profile.metadata.updated");
		}
	});

	it("should be possible to get users by a query with expanded profile w/ old user data", async () => {
		await insertTestUsers(5);
		config.userFields = [constants.dataset.REQUIRED_ONLY];
		await createTestUsers(5, 5);

		const { data: { users, totalCount }, status } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: { roles: { $in: ["user"] } },
				expand: "profile",
				sort: { "profile.firstName": 1 }
			}
		});

		expect(status).toBe(200);

		expect(users.length).toBe(10, "users.length");
		expect(totalCount).toBe(10, "totalCount");

		expect(users.filter(u => !!u.profile).length).toBe(5, "users without profile");
		expect(users.filter(u => !u.profile).length).toBe(5, "users with profile");

		users.forEach((u, i) => {
			if (i > 0 && u.profile && users[i - 1].profile)
				expect(u.profile.firstName.toLowerCase()).toBeGreaterThan(users[i - 1].profile.firstName.toLowerCase());
		});
	});

	it("should be possible to get users by a query and sort case insensitive", async () => {
		await createTestUsers(10);

		const user = await db.collection(constants.collections.USERS).findOne({ firstName: "user0-firstName" });
		user.firstName = "Z" + user.firstName.toUpperCase(); // If this was sorted case sensitive, "Z" would be less than "a", thus be the first entry
		await db.collection(constants.collections.USERS).update({ id: user.id }, user);

		const { data: { users, totalCount }, status } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: { roles: { $in: ["user"] } },
				sort: { firstName: 1 },
				filter: { firstName: 1, lastName: 1, id: 1 },
				caseInsensitiveSort: true
			}
		});

		expect(status).toBe(200);

		expect(users.length).toBe(10, "users.length");
		expect(totalCount).toBe(10, "totalCount");

		expect(users[9].firstName[0]).toBe("Z", "last entry should start with Z");

		users.forEach((u, i) => {
			expect(Object.keys(u).length).toBe(3);

			if (i > 0 && u && users[i - 1])
				expect(u.firstName.toLowerCase()).toBeGreaterThan(users[i - 1].firstName.toLowerCase());
		});
	});

	it("should be possible to get users by a query with expanded profile and sort case insensitive", async () => {
		config.userFields = [constants.dataset.REQUIRED_ONLY];
		await createTestUsers(10);

		const user = await db.collection(constants.collections.PROFILES).findOne({});
		user.firstName = "Z" + user.firstName.toUpperCase(); // If this was sorted case sensitive, "Z" would be less than "a"
		await db.collection(constants.collections.PROFILES).update({ id: user.id }, user);

		const { data: { users, totalCount }, status } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: { roles: { $in: ["user"] } },
				expand: "profile",
				sort: { "profile.firstName": 1 },
				caseInsensitiveSort: true
			}
		});

		expect(status).toBe(200);

		expect(users.length).toBe(10, "users.length");
		expect(totalCount).toBe(10, "totalCount");

		users.forEach((u, i) => {
			if (i > 0 && u.profile && users[i - 1].profile)
				expect(u.profile.firstName.toLowerCase()).toBeGreaterThan(users[i - 1].profile.firstName.toLowerCase());
		});
	});

	it("should be possible to paginate result from get users by query with `limit`", async () => {
		await insertTestUsers(10);

		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: { roles: { $in: ["user"] } },
				limit: 3
			}
		});

		expect(res.data.users.length).toBe(3, "res.data.length");
		expect(res.data.totalCount).toBe(10, "res.data.totalCount");

		for (let i = 0; i < 3; i++) {
			expect(res.data.users[i].id).toBe(`user${i}`, "res.data.users[i].id");
			expect(res.data.users[i].password).toBeUndefined("res.data.users[i].password");
			expect(res.data.users[i].salt).toBeUndefined("res.data.users[i].salt");
		}
	});

	it("should be possible to shift paginated result from get users by query with `start`", async () => {
		await insertTestUsers(10);

		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: { roles: { $in: ["user"] } },
				limit: 3,
				start: 3
			}
		});

		expect(res.data.users.length).toBe(3, "res.data.length");
		expect(res.data.totalCount).toBe(10, "res.data.totalCount");

		for (let i = 0; i < 3; i++) {
			expect(res.data.users[i].id).toBe(`user${i + 3}`, "res.data.users[i].id");
			expect(res.data.users[i].password).toBeUndefined("res.data.users[i].password");
			expect(res.data.users[i].salt).toBeUndefined("res.data.users[i].salt");
		}
	});

	it("should be possible to filter result with `filter`", async () => {
		await insertTestUsers(10);

		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: { roles: { $in: ["user"] } },
				limit: 3,
				start: 3,
				filter: {
					firstName: 1,
					lastName: 1
				}
			}
		});

		expect(res.data.users.length).toBe(3, "res.data.length");
		expect(res.data.totalCount).toBe(10, "res.data.totalCount");

		for (let i = 0; i < 3; i++) {
			expect(Object.keys(res.data.users[i]).length).toBe(2, "Object.keys(res.data.users[i]).length");
			expect(res.data.users[i].firstName).toBe(`user${i + 3}-firstName`, "res.data.users[i].firstName");
			expect(res.data.users[i].lastName).toBe(`user${i + 3}-lastName`, "res.data.users[i].lastName");
		}
	});

	it("should be possible to sort result with `sort`", async () => {
		await insertTestUsers(10);

		const { data: { users: usersRequest1, totalCount: totalCountRequest1 } } = await doRequest(1);
		const { data: { users: usersRequest2, totalCount: totalCountRequest2 } } = await doRequest(-1);

		expect(usersRequest1.length).toBe(3, "res.data.length");
		expect(totalCountRequest1).toBe(10, "totalCountRequest1");

		expect(usersRequest2.length).toBe(3, "res2.data.length");
		expect(totalCountRequest2).toBe(10, "totalCountRequest2");

		for (let i = 0; i < 3; i++) {
			if (i > 0) {
				expect(usersRequest1[i].customField).toBeGreaterThan(usersRequest1[i - 1].customField, "res.data.users[i].customField");
				expect(usersRequest2[i].customField).toBeLessThan(usersRequest2[i - 1].customField, "usersRequest2[i].customField");
			}
		}

		async function doRequest(sort) {
			return await await SpecUtils.busRequest({
				subject: constants.endpoints.service.GET_USERS_BY_QUERY,
				data: {
					query: { roles: { $in: ["user"] } },
					limit: 3,
					start: 3,
					filter: {
						firstName: 1,
						lastName: 1,
						customField: 1
					},
					sort: { customField: sort }
				}
			});
		}
	});

	it("should return empty array if no users can be found", async () => {
		await insertTestUsers(10);

		const res = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			data: {
				query: { roles: { $in: ["no-one-can-have-this-role"] } },
				limit: 3,
				start: 3,
				filter: {
					firstName: 1,
					lastName: 1
				}
			}
		});

		expect(res.data.users.length).toBe(0, "res.data.length");
		expect(res.data.totalCount).toBe(0, "res.data.totalCount");
	});

	/**
	 * @param {Number} number
	 * @param {Number=} startAt
	 */
	async function createTestUsers(number = 2, startAt = 0) {
		for (let i = startAt; i < startAt + number; i++) {
			await SpecUtils.createUser(getTestUserData(`user${i}`, i));
		}

		function getTestUserData(username, i) {
			return {
				firstName: `${username}-firstName`,
				lastName: `${username}-lastName`,
				email: `${username}@example.com`,
				roles: ["user"],
				password: username + "ABc123",
				customField: Math.cos(i)
			};
		}
	}

	/**
	 * @param {Number} number
	 * @param {Number=} startAt
	 */
	async function insertTestUsers(number = 2, startAt = 0) {
		const users = [];

		for (let i = startAt; i < startAt + number; i++) {
			users.push(`user${i}`);
		}

		return db.collection(constants.collections.USERS)
			.insert(users.map((username, i) => {
				return {
					id: username,
					firstName: `${username}-firstName`,
					lastName: `${username}-lastName`,
					email: `${username}@example.com`,
					salt: `${username}-salt`,
					roles: ["user"],
					password: username,
					customField: Math.cos(i)
				}
			}));
	}

});
