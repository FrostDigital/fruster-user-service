/*jslint latedef:false, esversion:6*/

var nsc = require("nats-server-control"),
	bus = require("fruster-bus"),
	mongo = require("mongodb-bluebird"),
	embeddedMongo = require("embedded-mongo-spec"),
	userService = require('../fruster-user-service'),
	uuid = require("uuid"),
	_ = require("lodash");

describe("Fruster - User service", () => {
	var server;
	var busPort = Math.floor(Math.random() * 6000 + 2000);
	var mongoPort = /*Math.floor(Math.random() * 6000 + 2000);*/ 27017;
	var busAddress = ["nats://localhost:" + busPort];
	var mongoProcess;

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
						return userService.start(busAddress, "mongodb://localhost:" + mongoPort);
					})
					.then(done)
					.catch(done);
			})
			.catch(err => {});
	});

	afterAll((done) => {
		nsc.stopServer(server);

		return mongo.connect("mongodb://localhost:" + mongoPort)
			.then((db) => {
				return db.dropCollection("users");
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
			"email": uuid.v4() + "@frostdigital.se",
			"password": "Localhost:8080"
		};
	}

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
				expect(_.size(err.error)).toBe(0);

				done();
			});
	});


});