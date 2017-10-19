const config = require("../../config");

class UserRepo {

	constructor(db) {
		this.collection = db.collection(config.userCollection);
	}

	/**
	 * Get users by given query. Can optionally pass in additional 
	 * object for pagination.
	 * 
	 * @param {Object=} query 
	 * @param {Object=} pagination 
	 */
	getUsers(query = {}, pagination = { skip: 0, limit: 0}) {
		return this.collection
			.find(query, {_id: 0})
			.skip(pagination.skip)
			.limit(pagination.limit)
			.toArray();
	}

	getById(userId) {
		return this.collection.findOne({id: userId}, {_id: 0});
	}

}

module.exports = UserRepo;