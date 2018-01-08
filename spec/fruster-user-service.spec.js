const nsc = require("nats-server-control");
const bus = require("fruster-bus");
const log = require("fruster-log");
const mongo = require("mongodb");
const uuid = require("uuid");
const _ = require("lodash");

const userService = require('../fruster-user-service');
const utils = require('../lib/utils/utils');
const conf = require('../config');
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

	it("should return 200 when user is successfully removed", done => {
		const user = mocks.getUserObject();

		testUtils.createUser(user)
			.then(createdUserResponse => {
				return bus.request({
					subject: constants.endpoints.service.DELETE_USER,
					skipOptionsRequest: true,
					timeout: 1000,
					message: {
						reqId: uuid.v4(),
						data: {
							id: createdUserResponse.data.id
						}
					}
				})
					.then(deleteResponse => {
						expect(deleteResponse.status).toBe(200);
						done();
					});
			});
	});

	it("should return 404 when trying to remove non-existent user", done => {
		const user = mocks.getUserObject();

		return bus.request({
			subject: constants.endpoints.service.DELETE_USER,
			timeout: 1000,
			skipOptionsRequest: true,
			message: {
				reqId: uuid.v4(),
				data: {
					id: uuid.v4()
				}
			}
		})
			.catch(deleteResponse => {
				expect(deleteResponse.status).toBe(404);
				done();
			});
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

										expect(newUser.password).not.toBe(oldUser.password);
										expect(newUser.salt).not.toBe(oldUser.salt);
										expect(newUser.hashDate).not.toBe(oldUser.hashDate);

										done();
									});
							});
					});
			});
	});

});