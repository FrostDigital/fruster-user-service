const Db = require("mongodb").Db;
const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants");
const config = require("../config");
const specConstants = require("./support/spec-constants");
const errors = require("../lib/errors");
const SpecUtils = require("./support/SpecUtils");


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

    it("should be possible to add role without scopes", async () => {
        const role = "padmin";

        await SpecUtils.busRequest({ subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE, data: { role }, user: { scopes: ["system.add-role"] } });

        const roles = await db.collection(constants.collections.ROLE_SCOPES).find({ role }).toArray();

        expect(roles[0].role).toBe(role, "roles[0].role");
        expect(roles[0].scopes.length).toBe(0, "roles[0].scopes.length");
    });

    it("should be possible to add role wtih multiple scopes", async () => {
        const role = "padmin";
        const scopes = ["1", "2"];

        await SpecUtils.busRequest({ subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE, data: { role, scopes }, user: { scopes: ["system.add-role"] } });

        const roles = await db.collection(constants.collections.ROLE_SCOPES).find({ role }).toArray();

        expect(roles[0].role).toBe(role, "roles[0].role");
        expect(roles[0].scopes[0]).toBe(scopes[0], "roles[0].scopes[0]");
        expect(roles[0].scopes[1]).toBe(scopes[1], "roles[0].scopes[1]");
    });

    it("should return 400 if role already exists", async done => {
        const role = "padmin";
        const scopes = ["1", "2"];

        await addRole();

        try {
            await addRole();
            done.fail();
        } catch (err) {
            expect(err.error.code).toBe(errors.get("fruster-user-service.SYSTEM_ROLE_ALREADY_EXISTS").error.code);
            done();
        }

        async function addRole() {
            await SpecUtils.busRequest({ subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE, data: { role, scopes }, user: { scopes: ["system.add-role"] } });
        }
    });

    it("should not add the same role more than once", async () => {
        const role = "padmin";
        const scopes = ["1", "2"];

        let errorsCount = 0;

        for (let i = 0; i < 10; i++) {
            try {
                await SpecUtils.busRequest({ subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE, data: { role, scopes }, user: { scopes: ["system.add-role"] } });
            } catch (err) {
                errorsCount++;
            }
        }

        const roles = await db.collection(constants.collections.ROLE_SCOPES).find({ role }).toArray();

        expect(roles.length).toBe(1, "roles.length");
        expect(errorsCount).toBe(9, "errorsCount");
    });

});