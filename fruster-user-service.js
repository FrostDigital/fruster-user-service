var bus = require("fruster-bus");
var mongo = require("mongodb-bluebird");
var conf = require("./config");
var database;

// CREATE
var createUser = require("./lib/create-user");

// READ
var getUser = require("./lib/get-user");
var getUsersHttp = require("./lib/http/get-users-http");
var getUserByIdHttp = require("./lib/http/get-user-by-id-http");
//TODO: Get users by Query http? => firstName=Viktor,Joel,Nils&lastName=Söderström ?

// UPDATE
var updateUser = require("./lib/update-user");
var updateUserHttp = require("./lib/http/update-user-http");

// DELETE
var deleteUser = require("./lib/delete-user");
var deleteUserHttp = require("./lib/http/delete-user-http");

// VALIDATE PASSWORD
var validatePassword = require("./lib/validate-password");

var createInitialUser = require("./lib/create-initial-user");

//TODO:
//Update password

//Add role(s)

//Remove role(s)

module.exports = {

	start: (busAddress, mongoUrl) => {
		return bus.connect(busAddress)
			.then(x => mongo.connect(mongoUrl))
			.then(db => createInitialUser(db).then(x => db))			
			.then(db => {
				database = db.collection(conf.userCollection);

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
				bus.subscribe("http.post.user", createUser.handle).permissions("admin.*");
				bus.subscribe("http.get.user", getUsersHttp.handle).permissions("admin.*");
				bus.subscribe("http.get.user.>", getUserByIdHttp.handle).permissions("admin.*");
				bus.subscribe("http.put.user.>", updateUserHttp.handle).permissions("admin.*");
				bus.subscribe("http.delete.user.>", deleteUserHttp.handle).permissions("admin.*");

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