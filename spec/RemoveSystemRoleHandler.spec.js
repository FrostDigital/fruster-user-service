const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants");
const config = require("../config");
const specConstants = require("./support/spec-constants");


describe("RemoveSystemRoleHandler", () => {

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

    it("should be possible to remove a role", async done => {
        try {
            const role = "padmin";

            await bus.request({
                subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    user: { scopes: ["system.add-role"] },
                    data: { role }
                }
            });

            const rolesPreRemove = await db.collection(constants.collections.ROLE_SCOPES).find({ role }).toArray();
            expect(rolesPreRemove.length).toBe(1, "roles.length");

            await bus.request({
                subject: constants.endpoints.http.admin.REMOVE_SYSTEM_ROLE,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    user: { scopes: ["system.remove-role"] },
                    data: { role }
                }
            });

            const rolesPostRemove = await db.collection(constants.collections.ROLE_SCOPES).find({ role }).toArray();
            expect(rolesPostRemove.length).toBe(0, "roles.length");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});