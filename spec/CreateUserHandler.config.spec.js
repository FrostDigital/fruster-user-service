const conf = require('../config');
const mocks = require('./support/mocks');
const constants = require('../lib/constants');
const RoleManager = require('../lib/managers/RoleManager');
const specConstants = require('./support/spec-constants');
const frusterTestUtils = require("fruster-test-utils");
const RoleScopesConfigRepo = require('../lib/repos/RoleScopesConfigRepo');
const log = require("fruster-log");
const bus = require("fruster-bus");
const uuid = require("uuid");


/** This is a seperate test because we need to set the config before  frusterTestUtils.startBeforeEach which means all other tests fail if set in the other test file 🤔 */
describe("CreateUserHandler w/ requireNames set to false", () => {

    /** @type {RoleManager} */
    let roleManager;

    /** @type {Boolean} */
    let requireNamesConfigDefaultValue;

    beforeAll(() => {
        requireNamesConfigDefaultValue = conf.requireNames;
        conf.requireNames = false;
    });

    afterAll(() => { conf.requireNames = requireNamesConfigDefaultValue; });

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions(async connection => {
                const roleScopesConfigRepo = new RoleScopesConfigRepo();
                await roleScopesConfigRepo.prepareRoles();
                roleManager = new RoleManager(roleScopesConfigRepo);
            }));

    it("should be possible to create user without names if configured to", async done => {
        conf.requireNames = false;
        mocks.mockMailService();

        try {
            const user = mocks.getUserObject();
            user.roles.push("super-admin");

            delete user.firstName;
            delete user.middleName;
            delete user.lastName;

            const response = await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });

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

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should be possible to create user with names if configured to not require it", async done => {
        conf.requireNames = false;
        mocks.mockMailService();

        try {
            const user = mocks.getUserObject();
            user.roles.push("super-admin");

            const response = await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });

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

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});