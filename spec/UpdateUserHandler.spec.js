const nsc = require("nats-server-control");
const bus = require("fruster-bus");
const log = require("fruster-log");
const mongo = require("mongodb");
const uuid = require("uuid");
const _ = require("lodash");

const userService = require('../fruster-user-service');
const utils = require('../lib/utils/utils');
const conf = require('../config');
const mocks = require('./support/mocks.js');
const testUtils = require('./support/test-utils.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");

let mongoDb;

describe("UpdateUserHandler", () => {

    let mongoDb;

    frusterTestUtils.startBeforeEach({
        mockNats: true,
        mongoUrl: "mongodb://localhost:27017/user-service-test",
        service: userService,
        afterStart: (connection) => {
            mongoDb = connection.db;
        }
    });

    afterEach((done) => {
        conf.requireEmailVerification = false;
        done();
    });

    it("should return updated user when updating user", async done => {
        try {
            const user = mocks.getUserObject();
            const createdUserResponse = await testUtils.createUser(user);
            const newFirstName = "Roland";
            const newLastName = "Svensson";
            const updateResponse = await bus.request({
                subject: constants.endpoints.service.UPDATE_USER,
                skipOptionsRequest: true,
                timeout: 1000,
                message: {
                    reqId: uuid.v4(),
                    data: { id: createdUserResponse.data.id, firstName: newFirstName, lastName: newLastName }
                }
            });

            expect(updateResponse.data.firstName).toBe(newFirstName, "updateResponse.data.firstName");
            expect(updateResponse.data.lastName).toBe(newLastName, "updateResponse.data.lastName");

            const testUser = await mongoDb.collection(conf.userCollection).findOne({ id: updateResponse.data.id });

            expect(testUser.emailVerified).toBe(true, "updateResponse.data.emailVerified");
            expect(testUser.emailVerificationToken).toBeUndefined("testUser.emailVerificationToken");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should return updated user when updating user via http", async done => {
        try {
            const user = mocks.getUserObject();
            const createdUserResponse = await testUtils.createUser(user);
            const newFirstName = "Roland";
            const newLastName = "Svensson";
            const updateResponse = await bus.request({
                subject: constants.endpoints.http.admin.UPDATE_USER,
                skipOptionsRequest: true,
                timeout: 1000,
                message: {
                    user: { scopes: ["admin.*"] },
                    reqId: uuid.v4(),
                    data: { firstName: newFirstName, lastName: newLastName },
                    params: { id: createdUserResponse.data.id }
                }
            });

            expect(updateResponse.data.firstName).toBe(newFirstName, "updateResponse.data.firstName");
            expect(updateResponse.data.lastName).toBe(newLastName, "updateResponse.data.lastName");

            const testUser = await mongoDb.collection(conf.userCollection).findOne({ id: updateResponse.data.id });

            expect(testUser.emailVerified).toBe(true, "updateResponse.data.emailVerified");
            expect(testUser.emailVerificationToken).toBeUndefined("testUser.emailVerificationToken");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should return error when user can't be updated", async done => {
        try {
            await bus.request({
                subject: constants.endpoints.service.UPDATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: { id: "ID_", email: "hello" }
                }
            });

            done.fail();
        } catch (err) {
            expect(err.status).toBe(400, "err.status");
            done();
        }
    });

    it("should return error when trying to update password", async done => {
        const user = mocks.getUserObject();
        const createdUserResponse = await testUtils.createUser(user);

        try {
            await bus.request({
                subject: constants.endpoints.service.UPDATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: { id: createdUserResponse.data.id, password: "new-password" }
                }
            });

            done.fail();
        } catch (err) {
            expect(err.status).toBe(400, err.status);
            expect(err.data).toBeUndefined("err.data");

            done();
        }
    });

    it("should return error when trying to update email with faulty email", async done => {
        const user = mocks.getUserObject();
        const createdUserResponse = await testUtils.createUser(user);

        try {
            await bus.request({
                subject: constants.endpoints.service.UPDATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: { id: createdUserResponse.data.id, email: "hello" }
                }
            });

            done.fail();
        } catch (err) {
            expect(err.status).toBe(400, "err.status");
            done();
        };
    });

    it("should return error when trying to update email with existing email", async done => {
        const user = mocks.getUserObject();
        const email = "new-email" + Math.random() + "@gotmail.com";

        const createdUserResponse = await testUtils.createUser(user);
        const id = createdUserResponse.data.id;
        user.email = email;

        await testUtils.createUser(user);

        try {
            await bus.request({
                subject: constants.endpoints.service.UPDATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: { id: id, email: email }
                }
            });

            done.fail();
        } catch (err) {
            expect(err.status).toBe(400, "err.status");
            done();
        }
    });

    it("should be possible to send old email with update request", async done => {
        try {
            const user = mocks.getUserObject();
            const email = user.email;

            const createdUserResponse = await testUtils.createUser(user);
            const id = createdUserResponse.data.id;
            user.email = email;

            const updateResponse = await bus.request({
                subject: constants.endpoints.service.UPDATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: { id: id, email: email, firstName: "greg" }
                }
            });

            expect(updateResponse.status).toBe(200, "updateResponse.status");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should not return error if no fields are updated", async done => {
        try {
            const user = mocks.getUserObject();
            const email = user.email;

            const createdUserResponse = await testUtils.createUser(user);
            const id = createdUserResponse.data.id;
            user.email = email;

            const updateResponse = await bus.request({
                subject: constants.endpoints.service.UPDATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: { id: id, email: email, firstName: user.firstName, lastName: user.lastName }
                }
            });

            expect(updateResponse.status).toBe(200, "updateResponse.status");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should resend verification mail when updating email if conf.requireEmailVerification is set to true", async (done) => {
        try {
            conf.requireEmailVerification = true;
            mocks.mockMailService();
            const user = mocks.getUserObject();
            const email = user.email;
            let id;

            const createdUserResponse = await testUtils.createUser(user);
            id = createdUserResponse.data.id;
            user.email = email;

            const updateResponse = await bus.request({
                subject: constants.endpoints.service.UPDATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        id: id,
                        email: email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    }
                }
            });

            const testUser = await mongoDb.collection(conf.userCollection).findOne({ id: updateResponse.data.id });

            expect(updateResponse.status).toBe(200, "updateResponse.status");
            expect(testUser.emailVerified).toBe(false, "updateResponse.data.emailVerified");
            expect(testUser.emailVerificationToken).toBeDefined("testUser.emailVerificationToken");

            conf.requireEmailVerification = false;

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});