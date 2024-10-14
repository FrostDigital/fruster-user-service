const mocks = require('./support/mocks.js');
const SpecUtils = require('./support/SpecUtils');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils").default;
const specConstants = require("./support/spec-constants");
const { v4 } = require('uuid');

describe("AddRolesHandler", () => {

	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async (conn) => {
				db = conn.db;

				try {
					await db.collection(constants.collections.ROLE_SCOPES).deleteMany({});
					await db.collection(constants.collections.PROFILES).deleteMany({});
					await db.collection(constants.collections.INITIAL_USER).deleteMany({});
					await db.collection(constants.collections.USERS).deleteMany({});
				} catch (e) {}
			}));



	it("should be possible to add a role to a user", async () => {
		const createdUser = (await SpecUtils.createUser(mocks.getUserObject())).data;

		await SpecUtils.busRequest(constants.endpoints.service.ADD_ROLES, {
			id: createdUser.id,
			roles: ["user"]
		});
		const userResponse = await SpecUtils.busRequest(constants.endpoints.service.GET_USER, { id: createdUser.id });

		expect(userResponse.data[0].roles.includes("admin")).toBe(true, `userResponse.data[0].roles.includes("admin")`);
		expect(userResponse.data[0].roles.includes("user")).toBe(true, `userResponse.data[0].roles.includes("user")`);

		expect(new Date(userResponse.data[0].metadata.updated).getTime())
			.toBeGreaterThan(new Date(createdUser.metadata.updated).getTime(), "userResponse.data.metadata.updated")
	});

	it("should be possible to add multiple roles to a user", async () => {
		const createdUser = (await SpecUtils.createUser(mocks.getUserObject())).data;
		await SpecUtils.busRequest(constants.endpoints.service.ADD_ROLES, {
			id: createdUser.id,
			roles: ["user", "super-admin"]
		});
		const userResponse = await SpecUtils.busRequest(constants.endpoints.service.GET_USER, { id: createdUser.id });

		expect(userResponse.data[0].roles.includes("admin")).toBe(true, `userResponse.data[0].roles.includes("admin")`);
		expect(userResponse.data[0].roles.includes("user")).toBe(true, `userResponse.data[0].roles.includes("user")`);
		expect(userResponse.data[0].roles.includes("super-admin")).toBe(true, `userResponse.data[0].roles.includes("super-admin")`);

		expect(new Date(userResponse.data[0].metadata.updated).getTime())
			.toBeGreaterThan(new Date(createdUser.metadata.updated).getTime(), "userResponse.data.metadata.updated")
	});

	it("should not be possible to add multiples of same role", async () => {
		const createdUser = (await SpecUtils.createUser(mocks.getUserObject())).data;

		await SpecUtils.busRequest(constants.endpoints.service.ADD_ROLES, {
			id: createdUser.id,
			roles: ["admin"]
		});

		const userResponse = await SpecUtils.busRequest(constants.endpoints.service.GET_USER, { id: createdUser.id });

		expect(userResponse.data[0].roles.length).toBe(1, "userResponse.data[0].roles.length");

		expect(new Date(userResponse.data[0].metadata.updated).getTime())
			.toBeGreaterThan(new Date(createdUser.metadata.updated).getTime(), "userResponse.data.metadata.updated")
	});

});
