const conf = require('../config');
const mocks = require('./support/mocks');
const constants = require('../lib/constants');
const RoleManager = require('../lib/managers/RoleManager');
const specConstants = require('./support/spec-constants');
const frusterTestUtils = require("fruster-test-utils");
const RoleScopesConfigRepo = require('../lib/repos/RoleScopesConfigRepo');
const SpecUtils = require("./support/SpecUtils");

/** This is a seperate test because we need to set the config before  frusterTestUtils.startBeforeEach which means all other tests fail if set in the other test file 🤔 */
describe("CreateUserHandler w/ requireNames set to false", () => {

    /** @type {RoleManager} */
    let roleManager;

    beforeAll(() => conf.requireNames = false);

    afterAll(() => SpecUtils.resetConfig());

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions(async () => {
                const roleScopesConfigRepo = new RoleScopesConfigRepo();
                await roleScopesConfigRepo.prepareRoles();
                roleManager = new RoleManager(roleScopesConfigRepo);
            }));

    it("should be possible to create user without names if configured to", async () => {
        conf.requireNames = false;
        mocks.mockMailService();

        const user = mocks.getUserObject();
        user.roles.push("super-admin");

        delete user.firstName;
        delete user.middleName;
        delete user.lastName;

        const response = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

        expect(response.status).toBe(201, "response.status");

        expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
        expect(response.error).toBeUndefined("response.error");

        expect(response.data.firstName).toBeUndefined("response.data.firstName");
        expect(response.data.middleName).toBeUndefined("response.data.middleName");
        expect(response.data.lastName).toBeUndefined("response.data.lastName");
        expect(response.data.email).toBe(user.email, "response.data.email");

        const roles = await roleManager.getRoles();
        const currentRoleScopes = [];

        Object.keys(roles)
            .forEach(role => {
                roles[role].forEach(scope => {
                    if (!currentRoleScopes.includes(scope))
                        currentRoleScopes.push(scope);
                });
            });

        expect(response.data.scopes.length).toBe(currentRoleScopes.length, "response.data.scopes.length");
    });

    it("should be possible to create user with names if configured to not require it", async () => {
        conf.requireNames = false;
        mocks.mockMailService();

        const user = mocks.getUserObject();
        user.roles.push("super-admin");

        const response = await SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);

        expect(response.status).toBe(201, "response.status");

        expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
        expect(response.error).toBeUndefined("response.error");

        expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
        expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
        expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
        expect(response.data.email).toBe(user.email, "response.data.email");

        const roles = await roleManager.getRoles();
        const currentRoleScopes = [];

        Object.keys(roles)
            .forEach(role => {
                roles[role].forEach(scope => {
                    if (!currentRoleScopes.includes(scope))
                        currentRoleScopes.push(scope);
                });
            });

        expect(response.data.scopes.length).toBe(currentRoleScopes.length, "response.data.scopes.length");
    });

});