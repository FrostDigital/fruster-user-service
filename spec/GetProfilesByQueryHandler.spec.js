const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants");
const specConstants = require("./support/spec-constants");
const TestUtils = require("./support/SpecUtils");
const config = require("../config");


describe("GetProfilesByQueryHandler", () => {

	frusterTestUtils
		.startBeforeEach({
			beforeStart: () => config.userFields = constants.dataset.REQUIRED_ONLY,
			...specConstants.testUtilsOptions()
		});

	afterEach(() => TestUtils.resetConfig());

	it("should be possible to get profiles by a simple query", async () => {
		const testUsers = await createTestUsers(10);

		const { data } = await TestUtils.busRequest({
			subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
			data: {
				query: {
					id: { $in: testUsers.map((u) => u.id).filter((u, i) => i % 2 !== 0) }
				},
				sort: { firstName: 1 } //Otherwise sort by id, because of profile.id index
			}
		});

		expect(data.profiles.length).toBe(5, "data.profiles.length");
		expect(data.totalCount).toBe(5, "data.totalCount");

		const selectedUsers = testUsers.filter((u, i) => i % 2 !== 0);

		for (let i = 0; i < 5; i++) {
			expect(data.profiles[i].id).toBe(selectedUsers[i].id, "data.profiles[i].id");
			expect(data.profiles[i].firstName).toBe(selectedUsers[i].profile.firstName, "data.profiles[i].firstName");
			expect(data.profiles[i].lastName).toBe(selectedUsers[i].profile.lastName, "data.profiles[i].lastName");
			expect(data.profiles[i].password).toBeUndefined("data.profiles[i].password");
			expect(data.profiles[i].salt).toBeUndefined("data.profiles[i].salt");
		}
	});

	it("should be possible to paginate result from get profiles by query with `limit`", async () => {
		const testUsers = await createTestUsers(10);

		const { data } = await TestUtils.busRequest({
			subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
			data: {
				query: { id: { $in: testUsers.map((u) => u.id) } },
				limit: 3,
				sort: { firstName: 1 } //Otherwise sort by id, because of profile.id index
			}
		});

		expect(data.profiles.length).toBe(3, "data.length");
		expect(data.totalCount).toBe(10, "data.totalCount");

		for (let i = 0; i < 3; i++) {
			expect(data.profiles[i].id).toBe(testUsers[i].id, "data.profiles[i].id");
			expect(data.profiles[i].firstName).toBe(testUsers[i].profile.firstName, "data.profiles[i].firstName");
			expect(data.profiles[i].lastName).toBe(testUsers[i].profile.lastName, "data.profiles[i].lastName");
			expect(data.profiles[i].password).toBeUndefined("data.profiles[i].password");
			expect(data.profiles[i].salt).toBeUndefined("data.profiles[i].salt");
		}
	});

	it("should be possible to shift paginated result from get profiles by query with `start`", async () => {
		const testUsers = await createTestUsers(10);

		const { data } = await TestUtils.busRequest({
			subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
			data: {
				query: { id: { $in: testUsers.map((u) => u.id) } },
				limit: 3,
				start: 3,
				sort: { firstName: 1 } //Otherwise sort by id, because of profile.id index
			}
		});

		expect(data.profiles.length).toBe(3, "data.length");
		expect(data.totalCount).toBe(10, "data.totalCount");

		for (let i = 0; i < 3; i++) {
			expect(data.profiles[i].id).toBe(testUsers[i + 3].id, "data.profiles[i].id");
			expect(data.profiles[i].firstName).toBe(testUsers[i + 3].profile.firstName, "data.profiles[i].firstName");
			expect(data.profiles[i].lastName).toBe(testUsers[i + 3].profile.lastName, "data.profiles[i].lastName");
			expect(data.profiles[i].password).toBeUndefined("data.profiles[i].password");
			expect(data.profiles[i].salt).toBeUndefined("data.profiles[i].salt");
		}
	});

	it("should be possible to filter result with `filter`", async () => {
		const testUsers = await createTestUsers(10);

		const { data } = await TestUtils.busRequest({
			subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
			data: {
				query: { id: { $in: testUsers.map((u) => u.id) } },
				limit: 3,
				start: 3,
				filter: {
					firstName: 1,
					lastName: 1
				},
				sort: { firstName: 1 } //Otherwise sort by id, because of profile.id index
			}
		});

		expect(data.profiles.length).toBe(3, "data.length");
		expect(data.totalCount).toBe(10, "data.totalCount");

		for (let i = 0; i < 3; i++) {
			expect(Object.keys(data.profiles[i]).length).toBe(2, "Object.keys(data.profiles[i]).length");
			expect(data.profiles[i].firstName).toBe(testUsers[i + 3].profile.firstName, "data.profiles[i].firstName");
			expect(data.profiles[i].lastName).toBe(testUsers[i + 3].profile.lastName, "data.profiles[i].lastName");
		}
	});

	it("should be possible to sort result with `sort`", async () => {
		const testUsers = await createTestUsers(10);
		const { data: data1 } = await doRequest(1, testUsers.slice(0, testUsers.length - 1).map(u => u.id));
		const { data: data2 } = await doRequest(-1, testUsers.slice(0, testUsers.length - 1).map(u => u.id));

		expect(data1.profiles.length).toBe(3, "data1.length");
		expect(data1.totalCount).toBe(9, "data1.totalCount");

		expect(data2.profiles.length).toBe(3, "data2.length");
		expect(data2.totalCount).toBe(9, "data2.totalCount");

		for (let i = 0; i < 3; i++) {
			expect(Object.keys(data1.profiles[i]).length).toBe(3);
			expect(Object.keys(data2.profiles[i]).length).toBe(3);

			if (i > 0) {
				expect(data1.profiles[i].customField).toBeGreaterThan(data1.profiles[i - 1].customField, "data1.profiles[i].customField");
				expect(data2.profiles[i].customField).toBeLessThan(data2.profiles[i - 1].customField, "data2.profiles[i].customField");
			}
		}

		/**
		 * @param {Number} sort
		 * @param {Array<String>} ids
		 */
		async function doRequest(sort, ids) {
			return await TestUtils.busRequest({
				subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
				data: {
					query: { id: { $in: ids } },
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

	it("should be possible to sort result with case insensitive`sort`", async () => {
		const testUsers = await createTestUsers(10);

		const { data: { profiles: profilesResp1, totalCount: totalCountResp1 } } = await doRequest(1, testUsers.map(u => u.id));
		const { data: { profiles: profilesResp2, totalCount: totalCountResp2 } } = await doRequest(-1, testUsers.map(u => u.id));

		expect(profilesResp1.length).toBe(3, "data.length");
		expect(totalCountResp1).toBe(10, "totalCountResp1");

		expect(profilesResp2.length).toBe(3, "data.length");
		expect(totalCountResp2).toBe(10, "totalCountResp2");

		for (let i = 0; i < 3; i++) {
			expect(Object.keys(profilesResp1[i]).length).toBe(3);
			expect(Object.keys(profilesResp2[i]).length).toBe(3);

			if (i > 0) {
				expect(profilesResp1[i].customField.toString()).toBeGreaterThan(profilesResp1[i - 1].customField.toString(), "profilesResp1[i].customField");
				expect(profilesResp2[i].customField.toString()).toBeLessThan(profilesResp2[i - 1].customField.toString(), "profilesResp2[i].customField");
			}
		}

		/**
		 * @param {Number} sort
		 * @param {Array<String>} ids
		 */
		async function doRequest(sort, ids) {
			return await TestUtils.busRequest({
				subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
				data: {
					query: { id: { $in: ids } },
					limit: 3,
					start: 3,
					filter: {
						firstName: 1,
						lastName: 1,
						customField: 1
					},
					sort: {
						customField: sort,
						firstName: 1,
						lastName: 1,
						"ramjam.tjoho": 1
					},
					caseInsensitiveSort: true
				}
			});
		}
	});

	it("should return empty array if no profiles can be found", async () => {
		await createTestUsers(10);

		const { data } = await TestUtils.busRequest({
			subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
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

		expect(data.profiles.length).toBe(0, "data.profiles.length");
		expect(data.totalCount).toBe(0, "data.totalCount");
	});

	/**
	 * @param {Number} number
	 * @param {Number=} startAt
	 */
	async function createTestUsers(number = 2, startAt = 0) {
		const users = [];

		for (let i = startAt; i < startAt + number; i++) {
			const u = await TestUtils.createUser(getTestUserData(`user${i}`, i));
			users.push(u.data);
		}

		return users;

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

});
