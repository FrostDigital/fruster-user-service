const util = require("util");
const jasmine_runner = require('./jasmine-runner.js');


module.exports = {

    fail: (done, reason) => {
        done.fail(util.inspect(reason, null, null, true));
    }

};