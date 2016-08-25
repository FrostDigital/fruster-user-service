/*jslint latedef:false, esversion:6*/

var bus = require('fruster-bus');
var mongo = require('mongodb-bluebird');
var database;

var createUser = require('./lib/create-user');
var getUser = require('./lib/get-user');
var getUsers = require('./lib/http/get-users');
var getUserById = require('./lib/http/get-user-by-id');
var validatePassword = require('./lib/validate-password');

module.exports = {

	start: (busAddress, mongoUrl) => {
		return bus.connect(busAddress)
			.then(x => {
				return mongo.connect(mongoUrl);
			})
			.then(db => {
				database = db.collection('users');

				createUser.init(database);
				getUser.init(database);
				validatePassword.init(database);

				//HTTP
				bus.subscribe('http.post.user', createUser.handle);
				bus.subscribe('http.get.user', getUsers.handle);
				bus.subscribe('http.get.user.*', getUserById.handle);

				//SERVICE
				bus.subscribe('user-service.validate-password', validatePassword.handle);
				bus.subscribe('user-service.create-user', createUser.handle);
				bus.subscribe('user-service.get-user', getUser.handle);

				//TEMP
				// bus.subscribe('http.post.validate-password', validatePassword.handle);
				// bus.subscribe('http.post.user-service-get', getUser.handle);
			});
	}

};