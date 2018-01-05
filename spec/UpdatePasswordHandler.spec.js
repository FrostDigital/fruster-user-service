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


describe("UpdatePasswordHandler", () => {

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

    it("should be possible to update password", async done => {
        try {
            const user = mocks.getUserObject();
            const createdUser = await testUtils.createUser(user);
            const updatePassword = {
                newPassword: "Localhost:8081",
                oldPassword: user.password,
                id: createdUser.data.id
            };
            const startUser = await db.collection("users")
                .findOne({ id: createdUser.data.id });

            await bus.request({
                subject: constants.endpoints.service.UPDATE_PASSWORD,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    user: createdUser.data,
                    data: updatePassword
                },
                timeout: 1000
            });

            const updatedUser = await db.collection("users")
                .findOne({ id: createdUser.data.id });

            expect(updatedUser.password).not.toBe(startUser.password);
            expect(updatedUser.salt).not.toBe(startUser.salt);
            expect(updatedUser.hashDate).not.toBe(startUser.hashDate);

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should not be possible to update someone else's password", async done => {
        try {
            const user = mocks.getUserObject();
            const response = await testUtils.createUser(user);
            const updatePassword = {
                newPassword: "Localhost:8081",
                oldPassword: user.password,
                id: "someone else's id"
            };

            try {
                await bus.request({
                    subject: constants.endpoints.service.UPDATE_PASSWORD,
                    timeout: 1000,
                    skipOptionsRequest: true,
                    message: {
                        reqId: uuid.v4(),
                        user: response.data,
                        data: updatePassword
                    }
                });

                done.fail();
            } catch (err) {
                expect(err.error.code).toBe(errors.errorCodes.forbidden);
                done();
            };
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should not be possible to update password without validating the old password", async done => {
        try {
            const user = mocks.getUserObject();
            const response = await testUtils.createUser(user);
            const updatePassword = {
                newPassword: "Localhost:8081",
                oldPassword: "nothing",
                id: response.data.id
            };

            try {
                await bus.request({
                    subject: constants.endpoints.service.UPDATE_PASSWORD,
                    timeout: 1000,
                    skipOptionsRequest: true,
                    message: {
                        reqId: uuid.v4(),
                        user: response.data,
                        data: updatePassword
                    }
                });

                done.fail();
            } catch (err) {
                expect(err.error.code).toBe(errors.errorCodes.forbidden);
                done();
            }
        } catch (err) {
            log.error(err);
            done.fail(err);
        }

    });

});