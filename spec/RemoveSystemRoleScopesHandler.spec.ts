import { Db } from "mongodb";
import frusterTestUtils from "@fruster/test-utils";
import constants from "../lib/constants";
import config from "../config";
import specConstants from "./support/spec-constants";
import SpecUtils from "./support/SpecUtils";


describe("RemoveSystemRoleScopesHandler", () => {

	let db: Db;
	let useDbRolesAndScopesDefaultValue: boolean;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions((connection) => { db = connection.db; }));

	beforeAll(() => {
		useDbRolesAndScopesDefaultValue = config.useDbRolesAndScopes;
		config.useDbRolesAndScopes = true;
	});

	afterAll(() => config.useDbRolesAndScopes = useDbRolesAndScopesDefaultValue);

	it("should be possible to remove scopes from a role", async () => {
		const role = "padmin";
		const newScopes = ["hello.from.vienna", "bye.from.vienna", "ram"];

		await SpecUtils.busRequest({
			subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE,
			user: { scopes: ["system.add-role"] },
			data: { role }
		});

		await SpecUtils.busRequest({
			subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE_SCOPES,
			user: { scopes: ["system.add-role-scopes"] },
			data: { scopes: newScopes, role }
		});

		await SpecUtils.busRequest({
			subject: constants.endpoints.http.admin.REMOVE_SYSTEM_ROLE_SCOPES,
			user: { scopes: ["system.remove-role-scopes"] },
			data: { scopes: [newScopes[0], newScopes[1]], role }
		});

		const roles = await db.collection(constants.collections.ROLE_SCOPES).find({ role }).toArray();

		expect(roles[0].role).toBe(role, "roles[0].role");
		expect(roles[0].scopes.length).toBe(1, "roles[0].scopes.length");
		expect(roles[0].scopes[0]).toBe(newScopes[2], "roles[0].scopes[0]");
	});

});
