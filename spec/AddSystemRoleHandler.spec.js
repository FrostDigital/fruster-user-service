const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants");
const config = require("../config");
const RoleModel = require("../lib/models/RoleModel");
const specConstants = require("./support/spec-constants");
const errors = require("../lib/errors");


describe("AddSystemRoleHandler", () => {

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

    it("should be possible to add role without scopes", async done => {
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

            const roles = await db.collection(constants.collections.ROLE_SCOPES).find({ role }).toArray();

            expect(roles[0].role).toBe(role, "roles[0].role");
            expect(roles[0].scopes.length).toBe(0, "roles[0].scopes.length");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should be possible to add role wtih multiple scopes", async done => {
        try {
            const role = "padmin";
            const scopes = ["1", "2"];

            await bus.request({
                subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    user: { scopes: ["system.add-role"] },
                    data: { role, scopes }
                }
            });

            const roles = await db.collection(constants.collections.ROLE_SCOPES).find({ role }).toArray();

            expect(roles[0].role).toBe(role, "roles[0].role");
            expect(roles[0].scopes[0]).toBe(scopes[0], "roles[0].scopes[0]");
            expect(roles[0].scopes[1]).toBe(scopes[1], "roles[0].scopes[1]");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should return 400 if role already exists", async done => {
        try {
            const role = "padmin";
            const scopes = ["1", "2"];

            await addRole();
            try {
                await addRole();
                done.fail();
            } catch (err) {
                expect(err.error.code).toBe(errors.get("SYSTEM_ROLE_ALREADY_EXISTS").error.code);
                done();
            }

            async function addRole() {
                await bus.request({
                    subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE,
                    skipOptionsRequest: true,
                    message: {
                        reqId: "reqId",
                        user: { scopes: ["system.add-role"] },
                        data: { role, scopes }
                    }
                });
            }
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should not add the same role more than once", async done => {
        try {
            const role = "padmin";
            const scopes = ["1", "2"];

            let errorsCount = 0;

            for (let i = 0; i < 10; i++) {
                try {
                    await bus.request({
                        subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE,
                        skipOptionsRequest: true,
                        message: {
                            reqId: "reqId",
                            user: { scopes: ["system.add-role"] },
                            data: { role, scopes }
                        }
                    });
                } catch (err) {
                    errorsCount++;
                }
            }

            const roles = await db.collection(constants.collections.ROLE_SCOPES).find({ role }).toArray();

            expect(roles.length).toBe(1, "roles.length");
            expect(errorsCount).toBe(9, "errorsCount");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});