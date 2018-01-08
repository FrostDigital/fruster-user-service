const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const uuid = require("uuid");

const userService = require('../fruster-user-service');
const testUtils = require('./support/test-utils.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");


describe("GetScopesHandler", () => {

    /** @type {Db} */
    let db;

    frusterTestUtils.startBeforeEach({
        mockNats: true,
        mongoUrl: "mongodb://localhost:27017/user-service-test",
        service: userService,
        afterStart: (connection) => {
            db = connection.db;
        }
    });


    it("should return scopes for requested role", async done => {
        try {
            const roles = ["admin"];
            const scopesResponse = await bus.request({
                subject: constants.endpoints.service.GET_SCOPES,
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
                subject: constants.endpoints.service.GET_SCOPES,
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