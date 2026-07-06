import bus from "@fruster/bus";
import * as service from "../../fruster-user-service";
import { getMongoUrl } from "./testUtils";
import { FrusterTestUtilsConnection } from "@fruster/test-utils";

const specConstants = {
	testUtilsOptions: (afterStart?: (connection: FrusterTestUtilsConnection) => void | Promise<void>) => ({
		mockNats: true,
		dropDatabase: true,
		bus,
		service,
		afterStart,
		get mongoUrl() {
			return getMongoUrl();
		}
	})
};

export default specConstants;
