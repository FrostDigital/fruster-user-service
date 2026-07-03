import { Db } from "mongodb";
import frusterTestUtils from "@fruster/test-utils";
import RoleScopesDbRepo from "../lib/repos/RoleScopesDbRepo";
import RoleManager from "../lib/managers/RoleManager";
import constants from "../lib/constants";
import config from "../config";
import RoleModel from "../lib/models/RoleModel";
import specConstants from "./support/spec-constants";
import RoleScopesConfigRepo from "../lib/repos/RoleScopesConfigRepo";
import SpecUtils from "./support/SpecUtils";


describe("RoleManager", () => {

	let db: Db;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => {
				db = connection.db;
			}));

	afterEach(() => SpecUtils.resetConfig());

	it("should be able to get roles from config", async () => {
		config.roles = "admin:user.hello;user:admin.hello";

		const roleScopesConfigRepo = new RoleScopesConfigRepo();
		await roleScopesConfigRepo.prepareRoles();

		const roleManager = new RoleManager(roleScopesConfigRepo);
		const roles = await roleManager.getRoles();

		expect(roles.admin[0]).toBe("user.hello", "roles.admin[0]");
		expect(roles.user[0]).toBe("admin.hello", "roles.user[0]");
	});

	it("should be able to get roles from database", async () => {
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
	});

	it("should save roles from config to database if database is empty", async () => {
		config.useDbRolesAndScopes = true;

		const roleScopesDbRepo = new RoleScopesDbRepo(db);
		await roleScopesDbRepo.prepareRoles();

		const roleManager = new RoleManager(roleScopesDbRepo);
		const roles = await roleManager.getRoles();

		expect(roles["super-admin"][0]).toBe("*", "roles[\"super-admin\"][0]");
		expect(roles.admin[0]).toBe("profile.get", "roles.admin[0]");
		expect(roles.admin[1]).toBe("user.*", "roles.admin[1]");
		expect(roles.user[0]).toBe("profile.get", "roles.user[0]");
	});

});
