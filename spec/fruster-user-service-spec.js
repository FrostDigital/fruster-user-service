var nsc = require("nats-server-control"),
	bus = require("fruster-bus"),
	mongo = require("mongodb-bluebird"),
	embeddedMongo = require("embedded-mongo-spec"),
	userService = require('../fruster-user-service'),
	uuid = require("uuid"),
	_ = require("lodash"),
	utils = require('../lib/utils/utils');

describe("Fruster - User service", () => {
	var server;
	var busPort = Math.floor(Math.random() * 6000 + 2000);
	var mongoPort = /*Math.floor(Math.random() * 6000 + 2000);*/ 27017;
	var busAddress = ["nats://localhost:" + busPort];
	var mongoProcess;
	var mongoUrl = "mongodb://localhost:" + mongoPort + "/user-service";

	beforeAll(done => {

		var server = nsc.startServer(busPort, {})
			.then(() => {
				function connectBus() {
					return bus.connect(busAddress);
				}

				function startEmbeddedMongo() {
					return embeddedMongo.open(mongoPort);
				}

				return connectBus()
					.then(startEmbeddedMongo)
					.then(() => {
						return userService.start(busAddress, mongoUrl);
					})
					.then(done)
					.catch(done);
			})
			.catch(err => {});
	});

	afterAll((done) => {
		nsc.stopServer(server);

		return mongo.connect(mongoUrl)
			.then((db) => {
				return db.dropCollection("users")
					.then(() => db.dropCollection("initial-user"));
			})
			.then(x => {
				embeddedMongo.close();
				done();
			});
	});

	function getUserObject() {
		return {
			"roles": ["ADMIN"],
			"firstName": "Viktor",
			"middleName": "Ludvig",
			"lastName": "Söderström",
			"email": uuid.v4() + "@frostdigxital.se",
			"password": "Localhost:8080"
		};
	}

	//CREATE

	it("should be possible to create user", done => {
		var user = getUserObject();

		bus.request("user-service.create-user", {
				data: user
			}, 1000)
			.then(response => {
				expect(response.status).toBe(201);

				expect(_.size(response.data)).not.toBe(0);
				expect(_.size(response.error)).toBe(0);

				expect(response.data.firstName).toBe(user.firstName);
				expect(response.data.middleName).toBe(user.middleName);
				expect(response.data.lastName).toBe(user.lastName);
				expect(response.data.email).toBe(user.email);

				user.roles.forEach(role => {
					expect(response.data.scopes.length).toBe(_.size(utils.getRoles()[role.toLowerCase()]));
				});

				done();
			})
			.catch(err => {
				console.log("got error ", err);
			});
	});

	it("should not create the same role more than once when creating user", done => {
		var user = getUserObject();
		user.roles.push("ADMIN");
		user.roles.push("admin");
		user.roles.push("adMin");
		user.roles.push("user");

		bus.request("user-service.create-user", {
				data: user
			}, 1000)
			.then(response => {
				expect(response.status).toBe(201);

				expect(_.size(response.data)).not.toBe(0);
				expect(_.size(response.error)).toBe(0);

				expect(response.data.roles.length).toBe(2);

				done();
			})
			.catch(err => {
				console.log("got error ", err);
			});
	});

	it("should validate password when creating user", done => {
		var user = getUserObject();
		user.password = "hej";

		bus.request("user-service.create-user", {
				data: user
			}, 1000)
			.catch(err => {
				expect(err.status).toBe(400);

				expect(_.size(err.data)).toBe(0);
				expect(_.size(err.error)).not.toBe(0);

				done();
			});
	});

	it("should validate email when creating user", done => {
		var user = getUserObject();
		user.email = "email";

		bus.request("user-service.create-user", {
				data: user
			}, 1000)
			.catch(err => {
				expect(err.status).toBe(400);

				expect(_.size(err.data)).toBe(0);
				expect(_.size(err.error)).not.toBe(0);

				done();
			});
	});

	it("should validate required fields when creating user", done => {
		var user = getUserObject();
		delete user.firstName;

		doRequest(user)
			.then(x => {
				var user = getUserObject();
				delete user.lastName;
				return doRequest(user);
			})
			.then(x => {
				var user = getUserObject();
				delete user.email;
				return doRequest(user);
			})
			.then(x => {
				var user = getUserObject();
				delete user.password;
				return doRequest(user);
			})
			.then(x => {
				var user = getUserObject();
				delete user.lastName;
				return doRequest(user);
			})
			.then(done);


		function doRequest(userToCreate) {
			return new Promise(resolve => {
				bus.request("user-service.create-user", {
						data: userToCreate
					}, 1000)
					.catch(err => {
						expect(err.status).toBe(400);

						expect(_.size(err.data)).toBe(0);
						expect(_.size(err.error)).not.toBe(0);

						resolve();
					});
			});
		}
	});

	//VALIDATE PASSWORD

	it("should return 200 when validating correct password", done => {
		var user = getUserObject();

		bus.request("user-service.create-user", {
				data: user
			}, 1000)
			.then(x => {
				return bus.request("user-service.validate-password", {
					data: {
						username: user.email,
						password: user.password
					}
				}, 1000);
			})
			.then(response => {
				expect(response.status).toBe(200);

				expect(_.size(response.data)).toBe(0);
				expect(_.size(response.error)).toBe(0);

				done();
			});
	});

	it("should return 200 when validating incorrect password", done => {
		var user = getUserObject();

		bus.request("user-service.create-user", {
				data: user
			}, 1000)
			.then(x => {
				return bus.request("user-service.validate-password", {
					data: {
						username: user.email,
						password: "yoyoyo"
					}
				}, 1000);
			})
			.catch(err => {
				expect(err.status).toBe(401);
				expect(_.size(err.data)).toBe(0);

				done();
			});
	});

	//GET USER

	it("should return user object when getting user by id", done => {
		var user = getUserObject();
		var createdUser;

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

	it("should return user object when getting user by email", done => {
		var user = getUserObject();
		var createdUser;

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
		var user = getUserObject();
		var createdUsers = {};
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
						firstName: user.firstName
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
		var user = getUserObject();
		var createdUsers = {};
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
						firstName: user.firstName,
						lastName: user.lastName
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

	//UPDATE USER

	it("Should return updated user when updating user", done => {
		var user = getUserObject();

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
		var user = getUserObject();

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
		var user = getUserObject();

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
		var user = getUserObject();
		var id;

		var email = "new-email" + Math.random() + "@gotmail.com";

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

	it("Should return 200 when user is successfully removed", done => {
		var user = getUserObject();

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
		var user = getUserObject();

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

});