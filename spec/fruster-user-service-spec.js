const nsc = require("nats-server-control");
const bus = require("fruster-bus");
const log = require("fruster-log");
const mongo = require("mongodb-bluebird");
const uuid = require("uuid");
const _ = require("lodash");

const userService = require('../fruster-user-service');
const utils = require('../lib/utils/utils');
const conf = require('../config');
const mocks = require('./support/mocks.js');

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

	//GET USER

	it("should return user object when getting user by id", done => {
		const user = mocks.getUserObject();
		let createdUser;

		bus.request("user-service.create-user", {
			data: user
		}, 1000)
			.then(response => {
				createdUser = response.data;

				return bus.request("user-service.get-user", {
					data: {
						id: response.data.id
					}
				}, 1000);
			})
			.then(response => {
				validateGetUser(response.data[0], createdUser, response);
				done();
			})
			.catch(err => err);
	});

	it("should return empty array when sending in faulty query/query without result", done => {
		const user = mocks.getUserObject();
		let createdUser;

		bus.request("user-service.create-user", {
			data: user
		}, 1000)
			.then(response => {
				createdUser = response.data;

				return bus.request("user-service.get-user", {
					data: {
						$or: []
					}
				}, 1000);
			})
			.then(response => {
				expect(response.data.length).toBe(0);
				done();
			})
			.catch(err => err);
	});

	it("should return user object when getting user by email", done => {
		const user = mocks.getUserObject();
		let createdUser;

		bus.request("user-service.create-user", {
			data: user
		}, 1000)
			.then(response => {
				createdUser = response.data;

				return bus.request("user-service.get-user", {
					data: {
						email: response.data.email
					}
				}, 1000);
			})
			.then(response => {
				validateGetUser(response.data[0], createdUser, response);
				done();
			})
			.catch(err => err);
	});

	it("should return user object when getting user by firstName", done => {
		const user = mocks.getUserObject();
		const createdUsers = {};
		user.firstName = "veryUniqueNot" + Math.random();

		createUser(user)
			.then(created => {
				createdUsers[created.data.id] = created.data;
			})
			.then(x => {
				user.email = "241842" + user.email;
				return createUser(user);
			})
			.then(created => {
				createdUsers[created.data.id] = created.data;
			})
			.then(response => {
				return bus.request("user-service.get-user", {
					data: {
						firstName: user.firstName.toLowerCase()
					}
				}, 1000);
			})
			.then(response => {
				response.data.forEach(user => {
					validateGetUser(user, createdUsers[user.id], response);
				});
				expect(response.data.length).toBe(2);

				done();
			})
			.catch(err => err);
	});

	function validateGetUser(getUser, createdUser, response) {
		expect(response.status).toBe(200);

		expect(_.size(response.data)).not.toBe(0);
		expect(_.size(response.error)).toBe(0);

		expect(getUser.id).toBe(createdUser.id);
		expect(getUser.firstName).toBe(createdUser.firstName);
		expect(getUser.lastName).toBe(createdUser.lastName);
		expect(getUser.middleName).toBe(createdUser.middleName);
		expect(getUser.roles.length).toBe(createdUser.roles.length);

		createdUser.roles.forEach(role => {
			expect(getUser.scopes.length).toBe(_.size(utils.getRoles()[role]));
		});
	}

	it("should return user object when getting user by firstName and lastName", done => {
		const user = mocks.getUserObject();
		const createdUsers = {};
		user.firstName = "veryUniqueNot" + Math.random();

		createUser(user)
			.then(created => {
				createdUsers[created.data.id] = created.data;
			})
			.then(x => {
				user.email = "241842" + user.email;
				return createUser(user);
			})
			.then(created => {
				createdUsers[created.data.id] = created.data;
			})
			.then(response => {
				return bus.request("user-service.get-user", {
					data: {
						firstName: user.firstName.toLowerCase(),
						lastName: user.lastName.toLowerCase()
					}
				}, 1000);
			})
			.then(response => {
				expect(response.data.length).toBe(2);

				for (var i = 0; i < response.data.length; i++) {
					var user = response.data[i];

					expect(user.firstName).toBe(user.firstName);
					expect(user.lastName).toBe(user.lastName);

					if (i > 0) {
						expect(user.email).not.toBe(response.data[i - 1].email);
					}
				}

				done();
			})
			.catch(err => err);
	});

	function createUser(user) {
		return bus.request("user-service.create-user", {
			data: user
		}, 1000);
	}

	// get scopes
	it("should return scopes for requested role", done => {
		const roles = ["admin"];
		return bus.request("user-service.get-scopes", {
			data: roles
		})
			.then(resp => {
				expect(resp.data[0]).toBe("profile.get");
				done();
			});
	});


	//UPDATE USER

	it("Should return updated user when updating user", done => {
		const user = mocks.getUserObject();

		createUser(user)
			.then(createdUserResponse => {
				var newFirstName = "Roland",
					newLastName = "Svensson";

				return bus.request("user-service.update-user", {
					data: {
						id: createdUserResponse.data.id,
						firstName: newFirstName,
						lastName: newLastName
					}
				}, 1000)
					.then(updateResponse => {
						expect(updateResponse.data.firstName).toBe(newFirstName);
						expect(updateResponse.data.lastName).toBe(newLastName);
						done();
					});
			});
	});

	it("Should return error when user can't be updated", done => {
		return bus.request("user-service.update-user", {
			data: {
				id: "ID_",
				email: "hello"
			}
		}, 1000)
			.catch(updateResponse => {
				expect(updateResponse.status).toBe(400);
				done();
			});
	});

	it("Should return error when trying to update password", done => {
		const user = mocks.getUserObject();

		createUser(user)
			.then(createdUserResponse => {

				return bus.request("user-service.update-user", {
					data: {
						id: createdUserResponse.data.id,
						password: "new-password"
					}
				}, 1000)
					.catch(updateResponse => {
						expect(updateResponse.status).toBe(400);
						expect(_.size(updateResponse.data)).toBe(0);
						done();
					});
			});
	});

	it("Should return error when trying to update email with faulty email", done => {
		const user = mocks.getUserObject();

		createUser(user)
			.then(createdUserResponse => {
				return bus.request("user-service.update-user", {
					data: {
						id: createdUserResponse.data.id,
						email: "hello"
					}
				}, 1000)
					.catch(updateResponse => {
						expect(updateResponse.status).toBe(400);
						done();
					});
			});
	});

	it("Should return error when trying to update email with existing email", done => {
		const user = mocks.getUserObject();
		let id;

		const email = "new-email" + Math.random() + "@gotmail.com";

		createUser(user)
			.then((createdUserResponse) => {
				id = createdUserResponse.data.id;
				user.email = email;
				return createUser(user);
			})
			.then(createdUserResponse => {
				return bus.request("user-service.update-user", {
					data: {
						id: id,
						email: email
					}
				}, 1000)
					.catch(updateResponse => {
						expect(updateResponse.status).toBe(400);
						done();
					});
			});
	});

	it("Should be possible to send old email with update request", done => {
		const user = mocks.getUserObject();
		const email = user.email;
		let id;

		createUser(user)
			.then((createdUserResponse) => {
				id = createdUserResponse.data.id;
				user.email = email;
			})
			.then(createdUserResponse => {
				return bus.request("user-service.update-user", {
					data: {
						id: id,
						email: email,
						firstName: "greg"
					}
				}, 1000)
					.then(updateResponse => {
						expect(updateResponse.status).toBe(200);
						done();
					});
			});
	});

	it("Should not return error if no fields are updated", done => {
		const user = mocks.getUserObject();
		const email = user.email;
		let id;

		createUser(user)
			.then((createdUserResponse) => {
				id = createdUserResponse.data.id;
				user.email = email;
			})
			.then(createdUserResponse => {
				return bus.request("user-service.update-user", {
					data: {
						id: id,
						email: email,
						firstName: user.firstName,
						lastName: user.lastName
					}
				}, 1000)
					.then(updateResponse => {
						expect(updateResponse.status).toBe(200);
						done();
					});
			});
	});

	it("Should return 200 when user is successfully removed", done => {
		const user = mocks.getUserObject();

		createUser(user)
			.then(createdUserResponse => {
				return bus.request("user-service.delete-user", {
					data: {
						id: createdUserResponse.data.id
					}
				}, 1000)
					.then(updateResponse => {
						expect(updateResponse.status).toBe(200);
						done();
					});
			});
	});

	it("Should return 404 when trying to remove non-existent user", done => {
		const user = mocks.getUserObject();

		return bus.request("user-service.delete-user", {
			data: {
				id: uuid.v4()
			}
		}, 1000)
			.catch(updateResponse => {
				expect(updateResponse.status).toBe(404);
				done();
			});
	});

	it("Should be possible to update password", done => {
		const user = mocks.getUserObject();

		createUser(user)
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
					.then(userResp => {
						oldUser = userResp[0];
					})
					.then(x => {
						return bus.request("user-service.update-password", {
							user: response.data,
							data: updatePassword
						}, 1000)
							.then(x => {
								return mongoDb.collection("users")
									.find({
										id: response.data.id
									})
									.then(userResp => {
										var newUser = userResp[0];
										expect(newUser.password).not.toBe(oldUser.password);
										expect(newUser.salt).not.toBe(oldUser.salt);
										done();
									});
							});
					});
			});
	});

	it("should not be possible to update someone else's password", done => {
		const user = mocks.getUserObject();

		createUser(user)
			.then(response => {
				const updatePassword = {
					newPassword: "Localhost:8081",
					oldPassword: user.password,
					id: "someone else's id"
				};

				let oldUser;

				return bus.request("user-service.update-password", {
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

		createUser(user)
			.then(response => {
				const updatePassword = {
					newPassword: "Localhost:8081",
					oldPassword: "nothing",
					id: response.data.id
				};

				let oldUser;

				return bus.request("user-service.update-password", {
					user: response.data,
					data: updatePassword
				}, 1000)
					.catch(err => {
						done();
					});
			});
	});


	it("Should be possible to set password", done => {
		const user = mocks.getUserObject();

		createUser(user)
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
					.then(userResp => {
						oldUser = userResp[0];
					})
					.then(x => {
						return bus.request("user-service.set-password", {
							user: response.data,
							data: updatePassword
						}, 1000)
							.then(x => {
								return mongoDb.collection("users")
									.find({
										id: response.data.id
									})
									.then(userResp => {
										var newUser = userResp[0];
										expect(newUser.password).not.toBe(oldUser.password);
										expect(newUser.salt).not.toBe(oldUser.salt);
										done();
									});
							});
					});
			});
	});

	it("should be possible to add a role to a user", done => {
		const user = mocks.getUserObject();

		createUser(user)
			.then(createdUserResponse => createdUserResponse.data)
			.then(createdUser => bus.request("user-service.add-roles", {
				data: {
					id: createdUser.id,
					roles: ["user"]
				}
			})
				.then(x => {
					return bus.request("user-service.get-user", {
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

		createUser(user)
			.then(createdUserResponse => createdUserResponse.data)
			.then(createdUser => bus.request("user-service.add-roles", {
				data: {
					id: createdUser.id,
					roles: ["user", "super-admin"]
				}
			})
				.then(x => {
					return bus.request("user-service.get-user", {
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

		createUser(user)
			.then(createdUserResponse => createdUserResponse.data)
			.then(createdUser => bus.request("user-service.add-roles", {
				data: {
					id: createdUser.id,
					roles: ["admin"]
				}
			})
				.then(x => {
					return bus.request("user-service.get-user", {
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

		createUser(user)
			.then(createdUserResponse => createdUserResponse.data)
			.then(createdUser => bus.request("user-service.remove-roles", {
				data: {
					id: createdUser.id,
					roles: ["admin"]
				}
			})
				.then(x => {
					return bus.request("user-service.get-user", {
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

		createUser(user)
			.then(createdUserResponse => createdUserResponse.data)
			.then(createdUser => bus.request("user-service.remove-roles", {
				data: {
					id: createdUser.id,
					roles: ["admin", "super-admin"]
				}
			})
				.then(x => {
					return bus.request("user-service.get-user", {
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

		createUser(user)
			.then(createdUserResponse => createdUserResponse.data)
			.then(createdUser => bus.request("user-service.remove-roles", {
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