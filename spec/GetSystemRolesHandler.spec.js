const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const frusterTestUtils = require("fruster-test-utils");
const RoleScopesDbRepo = require("../lib/repos/RoleScopesDbRepo");
const RoleService = require("../lib/services/RoleService");
const constants = require("../lib/constants");
const config = require("../config");
const RoleModel = require("../lib/models/RoleModel");
const specConstants = require("./support/spec-constants");
const errors = require("../lib/errors");


describe("GetSystemRolesHandler", () => {

    /** @type {Db} */
    let db;
    /** @type {Boolean} */
    let useDbRolesAndScopesDefaultValue;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => {
                db = connection.db;
            }));

    beforeAll(() => {
        useDbRolesAndScopesDefaultValue = config.useDbRolesAndScopes;
        config.useDbRolesAndScopes = true;
    });

    afterAll(() => { config.useDbRolesAndScopes = useDbRolesAndScopesDefaultValue; });

    it("should be possible to get all roles", async done => {
        try {
            const role = "padmin";

            for (let i = 0; i < 3; i++) {
                await bus.request({
                    subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE,
                    skipOptionsRequest: true,
                    message: {
                        reqId: "reqId",
                        user: { scopes: ["system.add-role"] },
                        data: { role: role + i, scopes: [i.toString()] }
                    }
                });
            }

            const rolesResponse = await bus.request({
                subject: constants.endpoints.http.admin.GET_SYSTEM_ROLES,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    user: { scopes: ["system.get-roles"] },
                    data: {}
                }
            });

            const roleNames = rolesResponse.data.map(roleObj => roleObj.role);
            const roleScopes = rolesResponse.data.map(roleObj => roleObj.scopes.toString());

            expect(roleNames.includes(role + 0)).toBeTruthy();
            expect(roleNames.includes(role + 1)).toBeTruthy();
            expect(roleNames.includes(role + 2)).toBeTruthy();

            expect(roleScopes.includes("0")).toBeTruthy();
            expect(roleScopes.includes("1")).toBeTruthy();
            expect(roleScopes.includes("2")).toBeTruthy();

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should be possible to get all roles with config format", async done => {
        try {
            const role = "padmin";

            for (let i = 0; i < 3; i++) {
                await bus.request({
                    subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE,
                    skipOptionsRequest: true,
                    message: {
                        reqId: "reqId",
                        user: { scopes: ["system.add-role"] },
                        data: { role: role + i, scopes: [i.toString()] }
                    }
                });
            }

            const rolesResponse = await bus.request({
                subject: constants.endpoints.http.admin.GET_SYSTEM_ROLES,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    user: { scopes: ["system.get-roles"] },
                    query: { format: "config" },
                    data: {}
                }
            });

            expect(rolesResponse.data).toBe("super-admin:*;admin:profile.get,user.*;user:profile.get;padmin0:0;padmin1:1;padmin2:2;");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});