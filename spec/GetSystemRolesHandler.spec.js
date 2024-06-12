const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants");
const config = require("../config");
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");


describe("GetSystemRolesHandler", () => {

	/** @type {Boolean} */
	let useDbRolesAndScopesDefaultValue;

	frusterTestUtils
		.startBeforeEach(specConstants
			.testUtilsOptions());

	beforeAll(() => {
		useDbRolesAndScopesDefaultValue = config.useDbRolesAndScopes;
		config.useDbRolesAndScopes = true;
	});

	afterAll(() => config.useDbRolesAndScopes = useDbRolesAndScopesDefaultValue);

	it("should be possible to get all roles", async () => {
		const role = "padmin";

		await Promise.all(new Array(3).fill(null).map((x, i) =>
			SpecUtils.busRequest({
				subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE,
				data: { role: role + i, scopes: [i.toString()] },
				user: { scopes: ["system.add-role"] }
			})
		));

		const rolesResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.http.admin.GET_SYSTEM_ROLES,
			data: {},
			user: { scopes: ["system.get-roles"] }
		});

		const roleNames = rolesResponse.data.map(roleObj => roleObj.role);
		const roleScopes = rolesResponse.data.map(roleObj => roleObj.scopes.toString());

		expect(roleNames.includes(role + 0)).toBeTruthy();
		expect(roleNames.includes(role + 1)).toBeTruthy();
		expect(roleNames.includes(role + 2)).toBeTruthy();

		expect(roleScopes.includes("0")).toBeTruthy();
		expect(roleScopes.includes("1")).toBeTruthy();
		expect(roleScopes.includes("2")).toBeTruthy();
	});

	it("should be possible to get all roles with config format", async () => {
		const role = "padmin";

		await Promise.all(new Array(3).fill(null).map((x, i) =>
			SpecUtils.busRequest({ subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE, data: { role: role + i, scopes: [i.toString()] }, user: { scopes: ["system.add-role"] } })
		));

		const rolesResponse = await SpecUtils.busRequest({
			subject: constants.endpoints.http.admin.GET_SYSTEM_ROLES,
			data: {},
			user: { scopes: ["system.get-roles"] },
			query: { format: "config" }
		})

		/** Order of the roles in the config may vary */
		const pt1 = "super-admin:*;";
		const pt2 = "admin:profile.get,user.*;";
		const pt3 = "user:profile.get;";
		const pt4 = "padmin0:0;";
		const pt5 = "padmin1:1;";
		const pt6 = "padmin2:2;";

		expect(rolesResponse.data.includes(pt1)).toBeTruthy("rolesResponse.data.includes(pt1)");
		expect(rolesResponse.data.includes(pt2)).toBeTruthy("rolesResponse.data.includes(pt2)");
		expect(rolesResponse.data.includes(pt3)).toBeTruthy("rolesResponse.data.includes(pt3)");
		expect(rolesResponse.data.includes(pt4)).toBeTruthy("rolesResponse.data.includes(pt4)");
		expect(rolesResponse.data.includes(pt5)).toBeTruthy("rolesResponse.data.includes(pt5)");
		expect(rolesResponse.data.includes(pt6)).toBeTruthy("rolesResponse.data.includes(pt6)");

		expect(rolesResponse.data.replace(pt1, "").replace(pt2, "").replace(pt3, "").replace(pt4, "").replace(pt5, "").replace(pt6, "").length).toBe(0, "rolesResponse.data with all parts replaced with \"\"");
	});

});
