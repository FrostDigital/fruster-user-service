const config = require("../../config");

class UserRepo {

	constructor(db) {
		this.collection = db.collection(config.userCollection);
	}

	getUsers(query = {}) {
		return this.collection.find(query, {_id: 0}).toArray();
	}

	getById(userId) {
		return this.collection.findOne({id: userId}, {_id: 0});
	}

}

module.exports = UserRepo;