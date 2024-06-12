const uuid = require("uuid");
const Db = require("mongodb").Db;
const constants = require("../constants");
const UserModel = require("../models/UserModel");


class InitialUserRepo {

	/**
	 * @param {Db} db
	 */
	constructor(db) {
		this._collection = db.collection(constants.collections.INITIAL_USER);
	}

	/**
	 * Whether an entry for the initial user exists or not.
	 */
	exists() {
		return this._collection.findOne({}).then(u => !!u);
	}

	/**
	 * @param {UserModel} user
	 */
	saveInitialUser(user) {
		return this._collection.insertOne({
			_id: uuid.v4(),
			email: user.email
		});
	}

}

module.exports = InitialUserRepo;
