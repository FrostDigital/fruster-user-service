import config from "./config";
import { start as startService } from "./fruster-user-service";
import log from "@fruster/log";
import constants from "./lib/constants";
import bus from "@fruster/bus";
import { start as startHealth } from "@fruster/health";

(async () => {
	try {
		await startService(config.bus, config.mongoUrl);
		log.info(`Successfully started ${constants.SERVICE_NAME}`);
		startHealth(bus);
	} catch (err) {
		log.error(`Failed starting ${constants.SERVICE_NAME}`, err);
		process.exit(1);
	}
})();
