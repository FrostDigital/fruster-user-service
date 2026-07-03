import UserModel from "../lib/models/UserModel";
import RoleManager from "../lib/managers/RoleManager";
import config from "../config";
import mocks from "./support/mocks";
import Utils from "../lib/utils/Utils";
import SpecUtils from "./support/SpecUtils";


describe("UserModel", () => {

	afterEach(() => SpecUtils.resetConfig());

	it("should lowercase names if `config.lowerCaseName` is true", () => {
		config.lowerCaseName = true;

		const mockUser = mocks.getUserObject();
		const user = new UserModel(mockUser);

		expect(user.firstName).toBe(mockUser.firstName.toLowerCase(), "user.firstName");
		expect(user.middleName).toBe(mockUser.middleName!.toLowerCase(), "user.middleName");
		expect(user.lastName).toBe(mockUser.lastName.toLowerCase(), "user.lastName");
	});

	it("should convert names to title case for view model if if `config.lowerCaseName` is true", async () => {
		const roleManager = new RoleManager();

		config.lowerCaseName = true;

		const mockUser = mocks.getUserObject();
		const user = await new UserModel(mockUser).toViewModel(roleManager);

		expect(user.firstName).toBe(Utils.toTitleCase(mockUser.firstName), "user.firstName");
		expect(user.middleName).toBe(Utils.toTitleCase(mockUser.middleName!), "user.middleName");
		expect(user.lastName).toBe(Utils.toTitleCase(mockUser.lastName), "user.lastName");
	});

});
