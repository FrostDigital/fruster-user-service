import { v4 as uuidv4 } from "uuid";
import { Db, Collection } from "mongodb";
import constants from "../constants";
import UserModel from "../models/UserModel";

class InitialUserRepo {
	_collection: Collection;

	constructor(db: Db) {
		this._collection = db.collection(constants.collections.INITIAL_USER);
	}

	/**
	 * Whether an entry for the initial user exists or not.
	 */
	exists(): Promise<boolean> {
		return this._collection.findOne({}).then(u => !!u);
	}

	saveInitialUser(user: UserModel) {
		return this._collection.insertOne({
			_id: uuidv4(),
			email: user.email
		} as any);
	}
}

export default InitialUserRepo;
