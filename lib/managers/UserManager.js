const config = require("../../config");
const deprecatedErrors = require("../deprecatedErrors");


class UserManager {

    constructor() {

    }

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