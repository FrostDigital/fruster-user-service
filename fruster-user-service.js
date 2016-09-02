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

// UPDATE
var updateUser = require("./lib/update-user");
var updateUserHttp = require("./lib/http/update-user-http");

// DELETE
var deleteUser = require("./lib/delete-user");
var deleteUserHttp = require("./lib/http/delete-user-http");

// PASSWORD
var validatePassword = require("./lib/validate-password");
var updatePassword = require("./lib/update-password");
var setPassword = require("./lib/set-password");

// ROLES
var addRoles = require("./lib/add-roles");
var removeRoles = require("./lib/remove-roles");

// INITIAL USER
var createInitialUser = require("./lib/create-initial-user");

module.exports = {

	start: (busAddress, mongoUrl) => {
		return bus.connect(busAddress)
			.then(x => mongo.connect(mongoUrl))
			.then(db => createInitialUser(db).then(x => db))
			.then(db => {
				database = db.collection(conf.userCollection);

				//INITS//////////////////////////////////////////////////////////////////////////////////

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

				//PASSWORD
				validatePassword.init(database);
				updatePassword.init(database, validatePassword, getUser);
				setPassword.init(database);

				//ROLES
				addRoles.init(database);
				removeRoles.init(database);

				//ACTIONS///////////////////////////////////////////////////////////////////////////////

				//HTTP
				bus.subscribe("http.post.admin.user", createUser.handle);
				bus.subscribe("http.get.admin.user", getUsersHttp.handle).permissions("admin.*");
				bus.subscribe("http.get.admin.user.>", getUserByIdHttp.handle).permissions("admin.*");
				bus.subscribe("http.put.admin.user.>", updateUserHttp.handle).permissions("admin.*");
				bus.subscribe("http.delete.admin.user.>", deleteUserHttp.handle).permissions("admin.*");

				//SERVICE
				bus.subscribe("user-service.create-user", createUser.handle);
				bus.subscribe("user-service.get-user", getUser.handle);
				bus.subscribe("user-service.update-user", updateUser.handle);
				bus.subscribe("user-service.delete-user", deleteUser.handle);
				bus.subscribe("user-service.validate-password", validatePassword.handle);
				bus.subscribe("user-service.update-password", updatePassword.handle);
				bus.subscribe("user-service.set-password", setPassword.handle);
				bus.subscribe("user-service.add-roles", addRoles.handle);
				bus.subscribe("user-service.remove-roles", removeRoles.handle);
			});
	}

};