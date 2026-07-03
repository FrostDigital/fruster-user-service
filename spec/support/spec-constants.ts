import bus from "@fruster/bus";
import * as service from "../../fruster-user-service";
import { getMongoUrl } from "./testUtils";

const specConstants = {
	testUtilsOptions: (afterStart?: Function) => ({
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
