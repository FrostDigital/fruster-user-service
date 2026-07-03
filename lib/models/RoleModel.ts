class RoleModel {
	role: string;
	scopes: string[];

	constructor(json: { role: string; scopes?: string[] } | string, scopes?: string[]) {
		if (typeof json === "object") {
			this.role = json.role;
			this.scopes = json.scopes || [];
		} else {
			this.role = json;
			this.scopes = scopes || [];
		}
	}
}

export default RoleModel;
