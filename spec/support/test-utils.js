const util = require("util");
const jasmine_runner = require('./jasmine-runner.js');
const log = require("fruster-log");
const bus = require("fruster-bus");
const constants = require('../../lib/constants.js');

module.exports = {

    fail: (done, reason) => {
        done.fail(util.inspect(reason, null, null, true));
    },

    createUser: (user) => {
        return bus.request(constants.endpoints.service.CREATE_USER, {
            data: user
        }, 1000);
    }

};