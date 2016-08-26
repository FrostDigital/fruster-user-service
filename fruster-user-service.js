/*jslint latedef:false, esversion:6*/

var bus = require('fruster-bus');
var createUser = require('./lib/create-user');
var validatePassword = require('./lib/validate-password');
var mongo = require('mongodb-bluebird');
var database;

module.exports = {

	start: (busAddress, mongoUrl) => {
		return bus.connect(busAddress)
			.then(x => {
				return mongo.connect(mongoUrl);
			})
			.then(db => {
				database = db.collection('users');
			})
			.then(x => {
				createUser.init(database);
				validatePassword.init(database);

				//HTTP
				bus.subscribe('http.post.user', createUser.handle);

				//SERVICE
				bus.subscribe('user-service.validate-password', validatePassword.handle);
				bus.subscribe('user-service.create-user', createUser.handle);

				//TEMP
				// bus.subscribe('http.post.validate-password', validatePassword.handle);
			});
	}

};