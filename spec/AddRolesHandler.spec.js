const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const uuid = require("uuid");

const userService = require('../fruster-user-service');
const mocks = require('./support/mocks.js');
const testUtils = require('./support/test-utils.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");


describe("AddRolesHandler", () => {

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

    it("should be possible to add a role to a user", async done => {
        try {
            const createdUser = (await testUtils.createUser(mocks.getUserObject())).data;
            await bus.request({
                subject: constants.endpoints.service.ADD_ROLES,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        id: createdUser.id,
                        roles: ["user"]
                    }
                }
            });

            const userResponse = (await bus.request({
                subject: constants.endpoints.service.GET_USER,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: { id: createdUser.id }
                }
            }));

            expect(userResponse.data[0].roles.includes("admin")).toBe(true, `userResponse.data[0].roles.includes("admin")`);
            expect(userResponse.data[0].roles.includes("user")).toBe(true, `userResponse.data[0].roles.includes("user")`);

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should be possible to add multiple roles to a user", async done => {
        try {
            const createdUser = (await testUtils.createUser(mocks.getUserObject())).data;

            await bus.request({
                subject: constants.endpoints.service.ADD_ROLES,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        id: createdUser.id,
                        roles: ["user", "super-admin"]
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

            expect(userResponse.data[0].roles.includes("admin")).toBe(true, `userResponse.data[0].roles.includes("admin")`);
            expect(userResponse.data[0].roles.includes("user")).toBe(true, `userResponse.data[0].roles.includes("user")`);
            expect(userResponse.data[0].roles.includes("super-admin")).toBe(true, `userResponse.data[0].roles.includes("super-admin")`);

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should not be possible to add multiples of same role", async done => {
        try {
            const createdUser = (await testUtils.createUser(mocks.getUserObject())).data;

            await bus.request({
                subject: constants.endpoints.service.ADD_ROLES,
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

            expect(userResponse.data[0].roles.length).toBe(1, "userResponse.data[0].roles.length");

            done();

        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});