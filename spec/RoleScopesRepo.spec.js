const Db = require("mongodb").Db;
const frusterTestUtils = require("fruster-test-utils");
const RoleScopesDbRepo = require("../lib/repos/RoleScopesDbRepo");
const RoleService = require("../lib/services/RoleService");
const constants = require("../lib/constants");


describe("RoleScopesRepo", () => {

    /** @type {Db} */
    let db;

    frusterTestUtils.startBeforeEach({
        mockNats: true,
        mongoUrl: "mongodb://localhost:27017/user-service-test",
        afterStart: (connection) => {
            db = connection.db;
        }
    });


    it("should", async done => {
        const roleScopesDbRepo = new RoleScopesDbRepo(db);

        console.log(await roleScopesDbRepo.addRole("user"));
        console.log(await roleScopesDbRepo.addRole("admin"));
        console.log(await roleScopesDbRepo.addScopeToRole("user", "profile.get"));
        console.log(await roleScopesDbRepo.addScopeToRole("admin", "ram.ram"));
        console.log(await roleScopesDbRepo.addScopeToRole("admin", "ram.jam"));
        console.log(await roleScopesDbRepo.addScopeToRole("admin", "ram.ram"));
        console.log(await roleScopesDbRepo.addScopeToRole("admin", "ram.ram"));
        console.log(await roleScopesDbRepo.addScopeToRole("admin", "ram.ram"));
        console.log(await roleScopesDbRepo.removeScopeFromRole("admin", "ram.ram"));
        console.log(await roleScopesDbRepo.addScopeToRole("admin", "ram.ram"));

        const roles = await roleScopesDbRepo.getRoles();

        console.log("\n");
        console.log("=======================================");
        console.log("roles");
        console.log("=======================================");
        console.log(require("util").inspect(roles, null, null, true));
        console.log("\n");

        done();
    });

});