import AccountDataSetModel from "./AccountDataSetModel";

class ProfileModel extends AccountDataSetModel {
	constructor(json: Record<string, unknown>, isFilteredResult?: boolean) {
		super(json, isFilteredResult);

		if (!json.id)
			delete this.id;
	}
}

export default ProfileModel;
