const nsc = require("nats-server-control");
const bus = require("fruster-bus");
const log = require("fruster-log");
const mongo = require("mongodb");
const Db = mongo.Db;
const uuid = require("uuid");

const userService = require('../fruster-user-service');
const utils = require('../lib/utils/utils');
const conf = require('../config');
const mocks = require('./support/mocks.js');
const testUtils = require('./support/test-utils.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const errors = require("../lib/utils/errors");


fdescribe("RemoveRolesHandler", () => {

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

    it("should be possible to remove a role from a user", done => {
        const user = mocks.getUserObject();
        user.roles = ["user", "admin"];

        testUtils.createUser(user)
            .then(createdUserResponse => createdUserResponse.data)
            .then(createdUser => bus.request({
                subject: constants.endpoints.service.REMOVE_ROLES,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        id: createdUser.id,
                        roles: ["admin"]
                    }
                }
            })
                .then(x => {
                    return bus.request({
                        subject: constants.endpoints.service.GET_USER,
                        skipOptionsRequest: true,
                        message: {
                            reqId: uuid.v4(),
                            data: {
                                id: createdUser.id
                            }
                        }
                    })
                        .then(userResponse => userResponse.data[0])
                        .then(user => {
                            expect(user.roles.includes("admin")).toBe(false);
                            expect(user.roles.length).toBe(1);
                            done();
                        });
                }));
    });

    it("should be possible to remove multiple roles from a user", done => {
        const user = mocks.getUserObject();
        user.roles = ["user", "admin", "super-admin"];

        testUtils.createUser(user)
            .then(createdUserResponse => createdUserResponse.data)
            .then(createdUser => bus.request({
                subject: constants.endpoints.service.REMOVE_ROLES,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        id: createdUser.id,
                        roles: ["admin", "super-admin"]
                    }
                }
            })
                .then(x => {
                    return bus.request({
                        subject: constants.endpoints.service.GET_USER,
                        skipOptionsRequest: true,
                        message: {
                            reqId: uuid.v4(),
                            data: {
                                id: createdUser.id
                            }
                        }
                    })
                        .then(userResponse => userResponse.data[0])
                        .then(user => {
                            expect(user.roles.includes("admin")).toBe(false);
                            expect(user.roles.includes("super-admin")).toBe(false);
                            expect(user.roles.length).toBe(1);
                            done();
                        });
                }));
    });

    it("should not be possible to remove all from a user", done => {
        const user = mocks.getUserObject();

        testUtils.createUser(user)
            .then(createdUserResponse => createdUserResponse.data)
            .then(createdUser => bus.request({
                subject: constants.endpoints.service.REMOVE_ROLES,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        id: createdUser.id,
                        roles: ["admin"]
                    }
                }
            }))
            .catch(err => {
                expect(err.status).toBe(400);
                expect(err.error.code).toBe("user-service.400.14");
                done();
            });
    });

});