const Db = require("mongodb").Db;
const frusterTestUtils = require("fruster-test-utils")
const constants = require("../lib/constants");
const errors = require("../lib/errors");
const config = require("../config");
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");

describe("GetByAggregateHandler", () => {

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(async connection => {
				db = connection.db
				try {
					await db.collection(constants.collections.USERS).deleteMany({});
				} catch (e) {
				}
		}));

	let privateProperties;

	beforeAll(() => privateProperties = config.privateProperties);

	afterAll(() => { process.env.PRIVATE_PROPERTIES = undefined })

	it("should be possible to get by a aggregate", async () => {
		await insertTestUsers(10);

		const { data } = await SpecUtils.busRequest({
			subject: constants.endpoints.service.GET_BY_AGGREGATE,
			data: {
				aggregate: [
					{ $unwind: "$roles" },
					{
						$group: {
							_id: "$roles",
							count: { $sum: 1 }
						}
					},
					{ $sort: { _id: -1 } }
				]
			}
		});

		expect(data.length).toBe(1, "data.length");
		expect(data[0]._id).toBe("user", "data[0]._id");
		expect(data[0].count).toBe(10, "data[0].count");
	});

	it("should throw bad request error if trying to access private properties", async () => {
		await insertTestUsers(10);

		config.privateProperties = privateProperties + "|firstName|lastName";

		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.GET_BY_AGGREGATE,
				data: {
					aggregate: [
						{ $project: { lastName: 1 } }
					]
				}
			});

			expect(true).toBe(false, "Should not reach this point");
		} catch ({ error, status }) {
			expect(status).toBe(400, "status");
			expect(error.code).toBe(errors.badRequest().error.code, "code");
			expect(error.detail).toContain("Cannot expose password|salt|emailVerificationToken|hashDate", "detail");
		}
	});

	/**
	 * @param {Number} number
	 */
	async function insertTestUsers(number) {
		const users = [];

		for (let i = 0; i < number; i++) {
			users.push(`user${i}`);
		}

		return await db.collection(constants.collections.USERS)
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
