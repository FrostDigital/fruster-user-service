const frusterTestUtils = require("fruster-test-utils")
const constants = require("../lib/constants");
const errors = require("../lib/errors");
const Db = require("mongodb").Db;
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");

describe("GetByAggregateHandler", () => {

	/** @type {Db} */
	let db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions(connection => db = connection.db));

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

		expect(data.length).toBe(2, "data.length");
		expect(data[0]._id).toBe("user", "data[0]._id");
		expect(data[0].count).toBe(10, "data[0].count");
	});

	it("should throw bad request error if trying to access private properties", async done => {
		await insertTestUsers(10);

		try {
			await SpecUtils.busRequest({
				subject: constants.endpoints.service.GET_BY_AGGREGATE,
				data: {
					aggregate: [
						{ $project: { password: 1 } }
					]
				}
			});

			done.fail();
		} catch ({ error, status }) {
			expect(status).toBe(400, "status");
			expect(error.code).toBe(errors.badRequest().error.code, "code");
			expect(error.detail).toBe("Cannot expose password|salt|emailVerificationToken|hashDate", "detail");
			done();
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
