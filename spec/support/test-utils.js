const util = require("util");
const jasmine_runner = require("./jasmine-runner.js");
const log = require("fruster-log");
const bus = require("fruster-bus");
const constants = require("../../lib/constants.js");
const uuid = require("uuid");

module.exports = {

    fail: (done, reason) => {
        done.fail(util.inspect(reason, null, null, true));
    },

    createUser: (user) => {
        return bus.request({
            subject: constants.endpoints.service.CREATE_USER,
            timeout: 1000,
            skipOptionsRequest: true,
            message: {
                reqId: uuid.v4(),
                data: user
            }
        });
    }

};