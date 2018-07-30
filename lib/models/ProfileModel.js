const AccountDataSetModel = require("./AccountDataSetModel");


class ProfileModel extends AccountDataSetModel {

    /**
     * @param {Object} json 
     * @param {Boolean=} isFilteredResult 
     */
    constructor(json, isFilteredResult) {
        super(json, isFilteredResult);
    }

}

module.exports = ProfileModel;