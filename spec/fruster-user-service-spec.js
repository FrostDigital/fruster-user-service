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

let mongoDb;

describe("Fruster - User service", () => {
	let server;
	const busPort = Math.floor(Math.random() * 6000 + 2000);
	const busAddress = "nats://localhost:" + busPort;
	const testDb = "user-service-test";
	const mongoUrl = "mongodb://localhost:27017/" + testDb;

	beforeAll(async (done) => {
		try {
			server = await nsc.startServer(busPort);
			await bus.connect(busAddress);
			mongoDb = await mongo.connect(mongoUrl);
			await userService.start(busAddress, mongoUrl);
			done();
		} catch (err) {
			log.error(err);
			done.fail();
		}
	});

	afterAll(async (done) => {
		await nsc.stopServer(server);
		await mongoDb.dropDatabase(testDb)
		done();
	});

	// get scopes
	it("should return scopes for requested role", done => {
		const roles = ["admin"];
		return bus.request(constants.endpoints.service.GET_SCOPES, {
			data: roles
		})
			.then(resp => {
				expect(resp.data[0]).toBe("profile.get");
				done();
			});
	});


	it("should return 200 when user is successfully removed", done => {
		const user = mocks.getUserObject();

		testUtils.createUser(user)
			.then(createdUserResponse => {
				return bus.request(constants.endpoints.service.DELETE_USER, {
					data: {
						id: createdUserResponse.data.id
					}
				}, 1000)
					.then(deleteResponse => {
						expect(deleteResponse.status).toBe(200);
						done();
					});
			});
	});

	it("should return 404 when trying to remove non-existent user", done => {
		const user = mocks.getUserObject();

		return bus.request(constants.endpoints.service.DELETE_USER, {
			data: {
				id: uuid.v4()
			}
		}, 1000)
			.catch(deleteResponse => {
				expect(deleteResponse.status).toBe(404);
				done();
			});
	});

	it("should be possible to update password", done => {
		const user = mocks.getUserObject();

		testUtils.createUser(user)
			.then(response => {
				const updatePassword = {
					newPassword: "Localhost:8081",
					oldPassword: user.password,
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
						return bus.request(constants.endpoints.service.UPDATE_PASSWORD, {
							user: response.data,
							data: updatePassword
						}, 1000)
							.then(x => {
								return mongoDb.collection("users")
									.find({
										id: response.data.id
									})
									.toArray()
									.then(userResp => {
										var newUser = userResp[0];
										expect(newUser.password).not.toBe(oldUser.password);
										expect(newUser.salt).not.toBe(oldUser.salt);										
										expect(newUser.hashDate).not.toBe(oldUser.hashDate);
										done();
									});
							});
					});
			});
	});

	it("should not be possible to update someone else's password", done => {
		const user = mocks.getUserObject();

		testUtils.createUser(user)
			.then(response => {
				const updatePassword = {
					newPassword: "Localhost:8081",
					oldPassword: user.password,
					id: "someone else's id"
				};

				let oldUser;

				return bus.request(constants.endpoints.service.UPDATE_PASSWORD, {
					user: response.data,
					data: updatePassword
				}, 1000)
					.catch(err => {
						done();
					});
			});
	});

	it("should not be possible to update password without validating the old password", done => {
		const user = mocks.getUserObject();

		testUtils.createUser(user)
			.then(response => {
				const updatePassword = {
					newPassword: "Localhost:8081",
					oldPassword: "nothing",
					id: response.data.id
				};

				let oldUser;

				return bus.request(constants.endpoints.service.UPDATE_PASSWORD, {
					user: response.data,
					data: updatePassword
				}, 1000)
					.catch(err => {
						done();
					});
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
						return bus.request(constants.endpoints.service.SET_PASSWORD, {
							user: response.data,
							data: updatePassword
						}, 1000)
							.then(x => {
								return mongoDb.collection("users")
									.find({
										id: response.data.id
									})
									.toArray()
									.then(userResp => {
										var newUser = userResp[0];
										expect(newUser.password).not.toBe(oldUser.password);
										expect(newUser.salt).not.toBe(oldUser.salt);
										expect(newUser.hashDate).not.toBe(oldUser.hashDate);
										done();
									});
							});
					});
			});
	});

	it("should be possible to add a role to a user", done => {
		const user = mocks.getUserObject();

		return testUtils.createUser(user)
			.then(createdUserResponse => createdUserResponse.data)
			.then(createdUser => bus.request(constants.endpoints.service.ADD_ROLES, {
				data: {
					id: createdUser.id,
					roles: ["user"]
				}
			})
				.then(() => {
					return bus.request(constants.endpoints.service.GET_USER, {
						data: {
							id: createdUser.id
						}
					})
						.then(userResponse => userResponse.data[0])
						.then(user => {
							expect(user.roles.includes("admin")).toBe(true);
							expect(user.roles.includes("user")).toBe(true);
							done();
						});
				}));
	});

	it("should be possible to add multiple roles to a user", done => {
		const user = mocks.getUserObject();

		testUtils.createUser(user)
			.then(createdUserResponse => createdUserResponse.data)
			.then(createdUser => bus.request(constants.endpoints.service.ADD_ROLES, {
				data: {
					id: createdUser.id,
					roles: ["user", "super-admin"]
				}
			})
				.then(x => {
					return bus.request(constants.endpoints.service.GET_USER, {
						data: {
							id: createdUser.id
						}
					})
						.then(userResponse => userResponse.data[0])
						.then(user => {
							expect(user.roles.includes("admin")).toBe(true);
							expect(user.roles.includes("user")).toBe(true);
							expect(user.roles.includes("super-admin")).toBe(true);
							done();
						});
				}));
	});

	it("should not be possible to add multiples of same role", done => {
		const user = mocks.getUserObject();

		testUtils.createUser(user)
			.then(createdUserResponse => createdUserResponse.data)
			.then(createdUser => bus.request(constants.endpoints.service.ADD_ROLES, {
				data: {
					id: createdUser.id,
					roles: ["admin"]
				}
			})
				.then(x => {
					return bus.request(constants.endpoints.service.GET_USER, {
						data: {
							id: createdUser.id
						}
					})
						.then(userResponse => userResponse.data[0])
						.then(user => {
							expect(user.roles.length).toBe(1);
							done();
						});
				}));
	});

	it("should be possible to remove a role from a user", done => {
		const user = mocks.getUserObject();
		user.roles = ["user", "admin"];

		testUtils.createUser(user)
			.then(createdUserResponse => createdUserResponse.data)
			.then(createdUser => bus.request(constants.endpoints.service.REMOVE_ROLES, {
				data: {
					id: createdUser.id,
					roles: ["admin"]
				}
			})
				.then(x => {
					return bus.request(constants.endpoints.service.GET_USER, {
						data: {
							id: createdUser.id
						}
					})
						.then(userResponse => userResponse.data[0])
						.then(user => {
							expect(user.roles.includes("admin")).toBe(false);
							expect(user.roles.length).toBe(1);
							done();
						});
				}));
	});

	it("should be possible to remove multiple roles from a user", done => {
		const user = mocks.getUserObject();
		user.roles = ["user", "admin", "super-admin"];

		testUtils.createUser(user)
			.then(createdUserResponse => createdUserResponse.data)
			.then(createdUser => bus.request(constants.endpoints.service.REMOVE_ROLES, {
				data: {
					id: createdUser.id,
					roles: ["admin", "super-admin"]
				}
			})
				.then(x => {
					return bus.request(constants.endpoints.service.GET_USER, {
						data: {
							id: createdUser.id
						}
					})
						.then(userResponse => userResponse.data[0])
						.then(user => {
							expect(user.roles.includes("admin")).toBe(false);
							expect(user.roles.includes("super-admin")).toBe(false);
							expect(user.roles.length).toBe(1);
							done();
						});
				}));
	});

	it("should not be possible to remove all from a user", done => {
		const user = mocks.getUserObject();

		testUtils.createUser(user)
			.then(createdUserResponse => createdUserResponse.data)
			.then(createdUser => bus.request(constants.endpoints.service.REMOVE_ROLES, {
				data: {
					id: createdUser.id,
					roles: ["admin"]
				}
			}))
			.catch(err => {
				expect(err.status).toBe(400);
				expect(err.error.code).toBe("user-service.400.14");
				done();
			});
	});



});