const Db = require("mongodb").Db;
const frusterTestUtils = require("fruster-test-utils");
const RoleScopesDbRepo = require("../lib/repos/RoleScopesDbRepo");
const RoleService = require("../lib/services/RoleService");
const constants = require("../lib/constants");
const config = require("../config");
const RoleModel = require("../lib/models/RoleModel");


describe("RoleService", () => {

    /** @type {Db} */
    let db;
    /** @type {String} */
    let rolesDefaultValue;

    frusterTestUtils.startBeforeEach({
        mockNats: true,
        mongoUrl: "mongodb://localhost:27017/user-service-test",
        afterStart: (connection) => {
            db = connection.db;
        }
    });

    beforeAll(() => { rolesDefaultValue = config.roles; });

    afterEach(() => { config.roles = rolesDefaultValue; });

    afterAll(() => { config.roles = rolesDefaultValue; });

    it("should be able to get roles from config", async done => {
        config.roles = "admin:user.hello;user:admin.hello";

        const roleService = new RoleService();
        const roles = await roleService.getRoles();

        expect(roles.admin[0]).toBe("user.hello", roles.admin[0]);
        expect(roles.user[0]).toBe("admin.hello", roles.user[0]);

        done();
    });

    it("should be able to get roles from database", async done => {
        await db.collection(constants.collections.ROLE_SCOPES)
            .insertMany([
                new RoleModel("admin", ["user.hello"]),
                new RoleModel("user", ["admin.hello"])
            ]);

        const roleService = new RoleService(new RoleScopesDbRepo(db));
        const roles = await roleService.getRoles();

        expect(config.roles).not.toBe("admin:user.hello;user:admin.hello", config.roles);
        expect(roles.admin[0]).toBe("user.hello", roles.admin[0]);
        expect(roles.user[0]).toBe("admin.hello", roles.user[0]);

        done();
    });

});