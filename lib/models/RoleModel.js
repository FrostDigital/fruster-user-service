class RoleModel {

    /**
     * @typedef {Object} JsonInput
     * 
     * @property {String} role
     * @property {Array<String>} scopes
     */

    /**
     * @param {JsonInput|String} json 
     * @param {Array<String>=} scopes 
     */
    constructor(json, scopes) {
        if (typeof json === "object") {
            this.role = json.role;
            this.scopes = json.scopes;
        } else {
            this.role = json;
            this.scopes = scopes;
        }
    }

}

module.exports = RoleModel;