import Jasmine from "jasmine";
import { SpecReporter } from "jasmine-spec-reporter";
import { startMongoDb, stopMongoDb } from "./testUtils";

const noop = () => {};

(async () => {
	await startMongoDb();

	const jrunner = new Jasmine({});
	jrunner.configureDefaultReporter({ print: noop });
	jasmine.getEnv().addReporter(new SpecReporter());
	jasmine.getEnv().addReporter({
		jasmineDone: async () => {
			await stopMongoDb();
		}
	});
	jrunner.loadConfigFile("./spec/support/jasmine.json");
	jrunner.execute();
})();

export default () => {};
