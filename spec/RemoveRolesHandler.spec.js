const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const uuid = require("uuid");

const userService = require('../fruster-user-service');
const mocks = require('./support/mocks.js');
const testUtils = require('./support/test-utils.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");


describe("RemoveRolesHandler", () => {

    /** @type {Db} */
    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => { db = connection.db; }));

    it("should be possible to remove a role from a user", async done => {
        try {
            const user = mocks.getUserObject();
            user.roles = ["user", "admin"];

            const createdUser = (await testUtils.createUser(user)).data;

            await bus.request({
                subject: constants.endpoints.service.REMOVE_ROLES,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        id: createdUser.id,
                        roles: ["admin"]
                    }
                }
            });

            const userResponse = await bus.request({
                subject: constants.endpoints.service.GET_USER,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: { id: createdUser.id }
                }
            });

            expect(userResponse.data[0].roles.includes("admin")).toBe(false, `userResponse.data[0].roles.includes("admin")`);
            expect(userResponse.data[0].roles.length).toBe(1, "userResponse.data[0].roles.length");

            done();
        } catch (err) {
            log.erro(err);
            done.fail(err);
        }
    });

    it("should be possible to remove multiple roles from a user", async done => {
        try {
            const user = mocks.getUserObject();
            user.roles = ["user", "admin", "super-admin"];

            const createdUser = (await testUtils.createUser(user)).data;

            await bus.request({
                subject: constants.endpoints.service.REMOVE_ROLES,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        id: createdUser.id,
                        roles: ["admin", "super-admin"]
                    }
                }
            });

            const userResponse = await bus.request({
                subject: constants.endpoints.service.GET_USER,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: { id: createdUser.id }
                }
            });

            expect(userResponse.data[0].roles.includes("admin")).toBe(false, `userResponse.data[0].roles.includes("admin")`);
            expect(userResponse.data[0].roles.includes("super-admin")).toBe(false, `userResponse.data[0].roles.includes("super-admin")`);
            expect(userResponse.data[0].roles.length).toBe(1, `userResponse.data[0].roles.length`);

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should not be possible to remove all from a user", async done => {
        try {
            const user = mocks.getUserObject();
            const createdUser = (await testUtils.createUser(user)).data;

            try {
                await bus.request({
                    subject: constants.endpoints.service.REMOVE_ROLES,
                    skipOptionsRequest: true,
                    message: {
                        reqId: uuid.v4(),
                        data: {
                            id: createdUser.id,
                            roles: ["admin"]
                        }
                    }
                });
            } catch (err) {
                expect(err.status).toBe(400, "err.status");
                expect(err.error.code).toBe("user-service.400.14", "err.error.code");

                done();
            }
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});