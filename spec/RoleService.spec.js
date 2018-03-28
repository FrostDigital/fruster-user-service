const Db = require("mongodb").Db;
const frusterTestUtils = require("fruster-test-utils");
const RoleScopesDbRepo = require("../lib/repos/RoleScopesDbRepo");
const RoleManager = require("../lib/managers/RoleManager");
const constants = require("../lib/constants");
const config = require("../config");
const RoleModel = require("../lib/models/RoleModel");
const specConstants = require("./support/spec-constants");
const RoleScopesConfigRepo = require("../lib/repos/RoleScopesConfigRepo");
const log = require("fruster-log");

describe("RoleManager", () => {

    const defaults = {
        /** @type {String} */
        roles: undefined,
        /** @type {Boolean} */
        useDbRolesAndScopes: undefined
    };

    /** @type {Db} */
    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => {
                db = connection.db;
            }));

    beforeAll(() => {
        defaults.roles = config.roles;
        defaults.useDbRolesAndScopes = config.useDbRolesAndScopes;
    });

    afterEach(() => {
        config.roles = defaults.roles;
        config.useDbRolesAndScopes = defaults.useDbRolesAndScopes;
    });

    afterAll(() => {
        config.roles = defaults.roles;
        config.useDbRolesAndScopes = defaults.useDbRolesAndScopes;
    });

    it("should be able to get roles from config", async done => {
        try {
            config.roles = "admin:user.hello;user:admin.hello";

            const roleScopesConfigRepo = new RoleScopesConfigRepo();
            await roleScopesConfigRepo.prepareRoles();

            const roleManager = new RoleManager(roleScopesConfigRepo);
            const roles = await roleManager.getRoles();

            expect(roles.admin[0]).toBe("user.hello", "roles.admin[0]");
            expect(roles.user[0]).toBe("admin.hello", "roles.user[0]");

            done();
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

    it("should be able to get roles from database", async done => {
        try {
            await db.collection(constants.collections.ROLE_SCOPES)
                .insertMany([
                    new RoleModel("admin", ["user.hello"]),
                    new RoleModel("user", ["admin.hello"])
                ]);

            const roleManager = new RoleManager(new RoleScopesDbRepo(db));
            const roles = await roleManager.getRoles();

            expect(config.roles).not.toBe("admin:user.hello;user:admin.hello", config.roles);
            expect(roles.admin[0]).toBe("user.hello", "roles.admin[0]");
            expect(roles.user[0]).toBe("admin.hello", "roles.user[0]");

            done();
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

    it("should save roles from config to database if database is empty", async done => {
        try {
            config.useDbRolesAndScopes = true;

            const roleScopesDbRepo = new RoleScopesDbRepo(db);
            await roleScopesDbRepo.prepareRoles();

            const roleManager = new RoleManager(roleScopesDbRepo);
            const roles = await roleManager.getRoles();

            expect(roles["super-admin"][0]).toBe("*", "roles[\"super-admin\"][0]");
            expect(roles.admin[0]).toBe("profile.get", "roles.admin[0]");
            expect(roles.admin[1]).toBe("user.*", "roles.admin[1]");
            expect(roles.user[0]).toBe("profile.get", "roles.user[0]");

            done();
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

});