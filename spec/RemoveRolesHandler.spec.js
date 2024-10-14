const mocks = require('./support/mocks.js');
const SpecUtils = require('./support/SpecUtils.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");


describe("RemoveRolesHandler", () => {

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions());

    it("should be possible to remove a role from a user", async () => {
        const user = mocks.getUserObject();
        user.roles = ["user", "admin"];

        const createdUser = (await SpecUtils.createUser(user)).data;

        await await SpecUtils.busRequest({
            subject: constants.endpoints.service.REMOVE_ROLES,
            data: { id: createdUser.id, roles: ["admin"] }
        });

        const userResponse = await SpecUtils.busRequest({
            subject: constants.endpoints.service.GET_USER,
            data: { id: createdUser.id }
        });

        expect(userResponse.data[0].roles.includes("admin")).toBe(false, `userResponse.data[0].roles.includes("admin")`);
        expect(userResponse.data[0].roles.length).toBe(1, "userResponse.data[0].roles.length");

        expect(new Date(userResponse.data[0].metadata.updated).getTime())
            .toBeGreaterThan(new Date(createdUser.metadata.updated).getTime(), "userResponse.data.metadata.updated")
    });

    it("should be possible to remove multiple roles from a user", async () => {
        const user = mocks.getUserObject();
        user.roles = ["user", "admin", "super-admin"];

        const createdUser = (await SpecUtils.createUser(user)).data;

        await await SpecUtils.busRequest({
            subject: constants.endpoints.service.REMOVE_ROLES,
            data: { id: createdUser.id, roles: ["admin", "super-admin"] }
        });

        const userResponse = await SpecUtils.busRequest({
            subject: constants.endpoints.service.GET_USER,
            data: { id: createdUser.id }
        });

        expect(userResponse.data[0].roles.includes("admin")).toBe(false, `userResponse.data[0].roles.includes("admin")`);
        expect(userResponse.data[0].roles.includes("super-admin")).toBe(false, `userResponse.data[0].roles.includes("super-admin")`);
        expect(userResponse.data[0].roles.length).toBe(1, `userResponse.data[0].roles.length`);

        expect(new Date(userResponse.data[0].metadata.updated).getTime())
            .toBeGreaterThan(new Date(createdUser.metadata.updated).getTime(), "userResponse.data.metadata.updated")
    });

    it("should not be possible to remove all from a user", async () => {
        const user = mocks.getUserObject();
        const createdUser = (await SpecUtils.createUser(user)).data;

        const err = await SpecUtils.busRequestExpectError({
                subject: constants.endpoints.service.REMOVE_ROLES,
                data: { id: createdUser.id, roles: ["admin"] }
            });

		expect(err.status).toBe(400, "err.status");
		expect(err.error.code).toBe("user-service.400.14", "err.error.code");
    });

});
