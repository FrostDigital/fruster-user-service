const config = require("./config");
const service = require("./fruster-user-service");
const log = require("fruster-log");
const constants = require("./lib/constants");


(async function () {

    try {
        await service.start(config.bus, config.mongoUrl);
        log.info(`Successfully started ${constants.SERVICE_NAME}`);
		require("fruster-health").start();
    } catch (err) {
        log.error(`Failed starting ${constants.SERVICE_NAME}`, err);
        process.exit(1);
    }

}());
