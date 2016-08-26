/*jslint latedef:false, esversion:6*/

var bus = require("fruster-bus");
var mongo = require("mongodb-bluebird");
var database;


// CREATE
var createUser = require("./lib/create-user");

// READ
var getUser = require("./lib/get-user");
var getUsersHttp = require("./lib/http/get-users-http");
var getUserByIdHttp = require("./lib/http/get-user-by-id-http");

// UPDATE
var updateUser = require("./lib/update-user");
var updateUserHttp = require("./lib/http/update-user-http");

// DELETE
var deleteUser = require("./lib/delete-user");
var deleteUserHttp = require("./lib/http/delete-user-http");

// VALIDATE PASSWORD
var validatePassword = require("./lib/validate-password");

module.exports = {

	start: (busAddress, mongoUrl) => {
		return bus.connect(busAddress)
			.then(x => {
				return mongo.connect(mongoUrl);
			})
			.then(db => {
				database = db.collection("users");

				//INITS
				//CREATE
				createUser.init(database);

				//READ
				getUser.init(database);
				getUsersHttp.init(getUser);
				getUserByIdHttp.init(getUser);

				//UPDATE
				updateUser.init(database);
				updateUserHttp.init(updateUser);

				//DELETE
				deleteUser.init(database);
				deleteUserHttp.init(deleteUser);

				//VALIDATE PASSWORD
				validatePassword.init(database);

				//ACTIONS

				//HTTP
				bus.subscribe("http.post.user", createUser.handle);
				bus.subscribe("http.get.user", getUsersHttp.handle);
				bus.subscribe("http.get.user.>", getUserByIdHttp.handle);
				bus.subscribe("http.put.user.>", updateUserHttp.handle);
				bus.subscribe("http.delete.user.>", deleteUserHttp.handle);

				//SERVICE
				bus.subscribe("user-service.validate-password", validatePassword.handle);
				bus.subscribe("user-service.create-user", createUser.handle);
				bus.subscribe("user-service.get-user", getUser.handle);
				bus.subscribe("user-service.update-user", updateUser.handle);
				bus.subscribe("user-service.delete-user", deleteUser.handle);

				//TEMP
				// bus.subscribe("http.post.validate-password", validatePassword.handle);
				// bus.subscribe("http.post.user-service-get", getUser.handle);
			});
	}

};