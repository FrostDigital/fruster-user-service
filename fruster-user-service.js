/*jslint latedef:false, esversion:6*/

var bus = require('fruster-bus');
var createUser = require('./lib/create-user');
var mongo = require('mongodb-bluebird');
var database;

module.exports = {

	start: (busPort, mongoUrl) => {
		bus.connect(busPort)
			.then(x => {
				return mongo.connect(mongoUrl);
			})
			.then(db => {
				console.log("Connected to mongo.");
				database = db.collection('users');
			})
			.then(x => {
				createUser.init(database);
				bus.subscribe('http.post.user-service', createUser.handle);
			});
	}

};