const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants");
const config = require("../config");
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");


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

            await SpecUtils.busRequest({ subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE, data: { role }, user: { scopes: ["system.add-role"] } });
            await SpecUtils.busRequest({ subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE_SCOPES, data: { scopes: newScopes, role }, user: { scopes: ["system.add-role-scopes"] } });

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

            await SpecUtils.busRequest({ subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE, data: { role }, user: { scopes: ["system.add-role"] } });
            await Promise.all(
                new Array(10).fill(null)
                    .map(() => SpecUtils.busRequest({
                        subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE_SCOPES,
                        data: { scopes: newScopes, role },
                        user: { scopes: ["system.add-role-scopes"] }
                    }))
            );

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