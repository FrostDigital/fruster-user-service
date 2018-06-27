const bus = require("fruster-bus");
const log = require("fruster-log");
const uuid = require("uuid");

const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");


describe("GetScopesForRolesHandler", () => {

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions());

    it("should return scopes for requested role", async done => {
        try {
            const roles = ["admin"];
            const scopesResponse = await bus.request({
                subject: constants.endpoints.service.GET_SCOPES_FOR_ROLES,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: roles
                }
            });

            expect(scopesResponse.data[0]).toBe("profile.get", "scopesResponse.data[0]");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should return empty array if invalid role can be found", async done => {
        try {
            const roles = ["ram"];
            const scopesResponse = await bus.request({
                subject: constants.endpoints.service.GET_SCOPES_FOR_ROLES,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: roles
                }
            });

            expect(scopesResponse.data.length).toBe(0, "scopesResponse.data.length");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});