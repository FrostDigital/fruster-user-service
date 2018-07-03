const config = require("../../config");

class UserManager {

    constructor() { }

    /**
     * Validates that update data is correct
     * 
     * @param {Object} data 
     */
    validateUpdateData(data) {
        if (data.firstName && config.lowerCaseName)
            data.firstName = data.firstName.toLowerCase();

        if (data.lastName && config.lowerCaseName)
            data.lastName = data.lastName.toLowerCase();

        if (data.middleName && config.lowerCaseName)
            data.middleName = data.middleName.toLowerCase();

        return data;
    }

}

module.exports = UserManager;