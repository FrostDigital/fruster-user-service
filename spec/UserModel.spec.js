const UserModel = require("../lib/models/UserModel");
const RoleManager = require("../lib/managers/RoleManager");
const config = require("../config");
const mocks = require("./support/mocks");
const utils = require("../lib/utils/utils");
const RoleScopesConfigRepo = require("../lib/repos/RoleScopesConfigRepo");
const log = require("fruster-log");

describe("UserModel", () => {

    afterEach(() => {
        config.lowerCaseName = false;
    });

    it("should lowercase names if `config.lowerCaseName` is true", done => {
        try {
            config.lowerCaseName = true;

            const mockUser = mocks.getUserObject();
            const user = new UserModel(mockUser);

            expect(user.firstName).toBe(mockUser.firstName.toLowerCase(), "user.firstName");
            expect(user.middleName).toBe(mockUser.middleName.toLowerCase(), "user.middleName");
            expect(user.lastName).toBe(mockUser.lastName.toLowerCase(), "user.lastName");

            done();
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

    it("should convert names to title case for view model if if `config.lowerCaseName` is true", async done => {
        try {
            const roleManager = new RoleManager();

            config.lowerCaseName = true;

            const mockUser = mocks.getUserObject();
            const user = await new UserModel(mockUser).toViewModel(roleManager);

            expect(user.firstName).toBe(utils.toTitleCase(mockUser.firstName), "user.firstName");
            expect(user.middleName).toBe(utils.toTitleCase(mockUser.middleName), "user.middleName");
            expect(user.lastName).toBe(utils.toTitleCase(mockUser.lastName), "user.lastName");

            done();
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

});