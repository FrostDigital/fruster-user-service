const AccountDataModel = require("./AccountDataModel");


class ProfileModel extends AccountDataModel {

    // TODO: 

    /**
     * @param {Object} json 
     * @param {Boolean=} isFilteredResult 
     */
    constructor(json, isFilteredResult) {
        super(json, isFilteredResult);
    }

}

module.exports = ProfileModel;