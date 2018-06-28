const AccountDataSetModel = require("./AccountDataSetModel");
const constants = require("../constants");


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