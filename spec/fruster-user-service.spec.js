const bus = require("fruster-bus");
const uuid = require("uuid");

const userService = require('../fruster-user-service');
const mocks = require('./support/mocks.js');
const testUtils = require('./support/test-utils.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");


describe("Fruster - User service", () => {

	let mongoDb;

	frusterTestUtils.startBeforeEach({
		mockNats: true,
		mongoUrl: "mongodb://localhost:27017/user-service-test",
		service: userService,
		afterStart: (connection) => {
			mongoDb = connection.db;
		}
	});

	it("should be possible to set password", done => {
		const user = mocks.getUserObject();

		testUtils.createUser(user)
			.then(response => {
				const updatePassword = {
					newPassword: "Localhost:8081",
					id: response.data.id
				};

				let oldUser;

				return mongoDb.collection("users")
					.find({
						id: response.data.id
					})
					.toArray()
					.then(userResp => {
						oldUser = userResp[0];
					})
					.then(x => {
						return bus.request({
							subject: constants.endpoints.service.SET_PASSWORD,
							timeout: 1000,
							skipOptionsRequest: true,
							message: {
								reqId: uuid.v4(),
								user: response.data,
								data: updatePassword
							}
						})
							.then(x => {
								return mongoDb.collection("users")
									.find({
										id: response.data.id
									})
									.toArray()
									.then(userResp => {
										const newUser = userResp[0];

										expect(newUser.password).not.toBe(oldUser.password, "newUser.password");
										expect(newUser.salt).not.toBe(oldUser.salt, "newUser.salt");
										expect(newUser.hashDate).not.toBe(oldUser.hashDate, "newUser.hashDate");

										done();
									});
							});
					});
			});
	});

});