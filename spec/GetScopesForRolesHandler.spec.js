const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");


describe("GetScopesForRolesHandler", () => {

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions());

    it("should return scopes for requested role", async () => {
        const roles = ["admin"];
        const scopesResponse = await SpecUtils.busRequest(constants.endpoints.service.GET_SCOPES_FOR_ROLES, roles);

        expect(scopesResponse.data[0]).toBe("profile.get", "scopesResponse.data[0]");
    });

    it("should return empty array if invalid role can be found", async () => {
        const roles = ["ram"];
        const scopesResponse = await SpecUtils.busRequest(constants.endpoints.service.GET_SCOPES_FOR_ROLES, roles);

        expect(scopesResponse.data.length).toBe(0, "scopesResponse.data.length");
    });

});