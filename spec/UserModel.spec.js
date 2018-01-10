const UserModel = require("../lib/models/UserModel");
const RoleService = require("../lib/services/RoleService");
const config = require("../config");
const mocks = require("./support/mocks");
const utils = require("../lib/utils/utils");


describe("UserModel", () => {

    afterEach(done => {
        config.lowerCaseName = false;
        done();
    });

    it("should lowercase names if `config.lowerCaseName` is true", () => {
        config.lowerCaseName = true;

        const mockUser = mocks.getUserObject();
        const user = new UserModel(mockUser);

        expect(user.firstName).toBe(mockUser.firstName.toLowerCase(), "user.firstName");
        expect(user.middleName).toBe(mockUser.middleName.toLowerCase(), "user.middleName");
        expect(user.lastName).toBe(mockUser.lastName.toLowerCase(), "user.lastName");
    });

    it("should convert names to title case for view model if if `config.lowerCaseName` is true", () => {
        const roleService = new RoleService();

        config.lowerCaseName = true;

        const mockUser = mocks.getUserObject();
        const user = new UserModel(mockUser).toViewModel(roleService);

        expect(user.firstName).toBe(utils.toTitleCase(mockUser.firstName), "user.firstName");
        expect(user.middleName).toBe(utils.toTitleCase(mockUser.middleName), "user.middleName");
        expect(user.lastName).toBe(utils.toTitleCase(mockUser.lastName), "user.lastName");
    });

});