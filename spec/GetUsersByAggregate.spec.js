const frusterTestUtils = require("fruster-test-utils")
const constants = require("../lib/constants");
const Db = require("mongodb").Db;
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");

describe("GetUsersByAggregateHandler", () => {

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(connection => db = connection.db));

	afterEach(() => SpecUtils.resetConfig());

	it("should be possible to get users by a aggregate", async () => {
		await insertTestUsers(10);

		const { data: { users } } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_AGGREGATE,
			data: {
				aggregate: [{ $match: { roles: { $in: ["user"] } } }]
			}
		});

		expect(users.length).toBe(10, "users.length");

		for (let i = 0; i < 10; i++) {
			expect(users[i]._id).toBeUndefined("users[i]._id");
			expect(users[i].password).toBeUndefined("users[i].password");
			expect(users[i].salt).toBeUndefined("users[i].salt");
		}
	});

	it("should be override $project to avoid get ignored attributes", async () => {
		await insertTestUsers(10);

		const { data: { users } } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_USERS_BY_AGGREGATE,
			data: {
				aggregate: [
					{ $match: { roles: { $in: ["user"] } } },
					{ $project: { firstName: 1, password: 1 } }
				]
			}
		});

		expect(users.length).toBe(10, "users.length");

		for (let i = 0; i < 10; i++) {
			expect(users[i]._id).toBeUndefined("users[i]._id");
			expect(users[i].password).toBeUndefined("users[i].password");
			expect(users[i].salt).toBeUndefined("users[i].salt");
			expect(users[i].firstName).toBeDefined("users[i].firstName");
		}
	});

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
			.insertMany(users.map((username, i) => {
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
