const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants");
const config = require("../config");
const specConstants = require("./support/spec-constants");


describe("AddSystemRoleScopesHandler", () => {

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

    it("should be possible to add scopes to a role", async done => {
        try {
            const role = "padmin";
            const newScopes = ["hello.from.vienna", "bye.from.vienna"];

            await bus.request({
                subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    user: { scopes: ["system.add-role"] },
                    data: { role }
                }
            });

            await bus.request({
                subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE_SCOPES,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    user: { scopes: ["system.add-role-scopes"] },
                    data: { scopes: newScopes, role }
                }
            });

            const roles = await db.collection(constants.collections.ROLE_SCOPES).find({ role }).toArray();

            expect(roles[0].role).toBe(role, "roles[0].role");
            expect(roles[0].scopes.length).toBe(2, "roles[0].scopes.length");
            expect(roles[0].scopes[0]).toBe(newScopes[0], "roles[0].scopes[0]");
            expect(roles[0].scopes[1]).toBe(newScopes[1], "roles[0].scopes[1]");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should not add the same scope multiple times", async done => {
        try {
            const role = "padmin";
            const newScopes = ["hello.from.vienna", "bye.from.vienna"];

            await bus.request({
                subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    user: { scopes: ["system.add-role"] },
                    data: { role }
                }
            });

            for (let i = 0; i < 10; i++) {
                await bus.request({
                    subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE_SCOPES,
                    skipOptionsRequest: true,
                    message: {
                        reqId: "reqId",
                        user: { scopes: ["system.add-role-scopes"] },
                        data: { scopes: newScopes, role }
                    }
                });
            }

            const roles = await db.collection(constants.collections.ROLE_SCOPES).find({ role }).toArray();

            expect(roles[0].role).toBe(role, "roles[0].role");
            expect(roles[0].scopes.length).toBe(2, "roles[0].scopes.length");
            expect(roles[0].scopes[0]).toBe(newScopes[0], "roles[0].scopes[0]");
            expect(roles[0].scopes[1]).toBe(newScopes[1], "roles[0].scopes[1]");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});