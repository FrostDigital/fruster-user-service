const bus = require("fruster-bus");
const constants = require("../../lib/constants.js");
const uuid = require("uuid");
const FrusterResponse = require("fruster-bus").FrusterResponse;
const config = require("../../config");
const configBackup = Object.assign({}, config);


class SpecUtils {

    static createUser(user) {
        return SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);
    }

    /**
     * Makes a bus request with the appropriate options for most tests.
     * 
     * @param {Object|String} options 
     * @param {Object=} inputData 
     * 
     * @return {Promise<FrusterResponse>}
     */
    static async busRequest(options, inputData) {
        let subject;

        if (typeof options === "string") {
            subject = options;
            options = {};
        }

        options = options || {};

        if (!subject)
            subject = options.subject;

        const reqId = options.reqId || uuid.v4();
        const user = options.user;
        const params = options.params;
        const query = options.query;
        const data = inputData || options.data;
        const req = { subject, skipOptionsRequest: true, message: { reqId } };

        if (user)
            req.message.user = user;
        if (params)
            req.message.params = params;
        if (query)
            req.message.query = query;
        if (data)
            req.message.data = data;

        return await bus.request(req);
    }

    static resetConfig() {
        Object.keys(configBackup)
            .forEach(conf => config[conf] = configBackup[conf]);
    }

}

module.exports = SpecUtils;