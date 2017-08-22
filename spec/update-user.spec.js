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

let mongoDb;

describe("fruster user service update user", () => {
    let server;
    const busPort = Math.floor(Math.random() * 6000 + 2000);
    const busAddress = "nats://localhost:" + busPort;
    const testDb = "user-service-test";
    const mongoUrl = "mongodb://localhost:27017/" + testDb;

    beforeAll(async (done) => {
        try {
            server = await nsc.startServer(busPort);
            await bus.connect(busAddress);
            mongoDb = await mongo.connect(mongoUrl);
            await userService.start(busAddress, mongoUrl);
            done();
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

    afterAll(async (done) => {
        await mongoDb.dropDatabase(testDb)
        done();
    });

    it("should return updated user when updating user", async done => {
        const user = mocks.getUserObject();
        const createdUserResponse = await testUtils.createUser(user);
        const newFirstName = "Roland";
        const newLastName = "Svensson";
        const updateResponse = await bus.request(constants.endpoints.service.UPDATE_USER, {
            data: { id: createdUserResponse.data.id, firstName: newFirstName, lastName: newLastName }
        }, 1000);

        expect(updateResponse.data.firstName).toBe(newFirstName);
        expect(updateResponse.data.lastName).toBe(newLastName);

        const testUser = await mongoDb.collection(conf.userCollection).findOne({ id: updateResponse.data.id });

        expect(testUser.emailVerified).toBe(true, "updateResponse.data.emailVerified");
        expect(testUser.emailVerificationToken).toBeUndefined("testUser.emailVerificationToken");

        done();
    });

    it("should return error when user can't be updated", async done => {
        try {
            await bus.request(constants.endpoints.service.UPDATE_USER, {
                data: { id: "ID_", email: "hello" }
            }, 1000);

            done.fail();
        } catch (err) {
            expect(err.status).toBe(400);
            done();
        }
    });

    it("should return error when trying to update password", async done => {
        const user = mocks.getUserObject();
        const createdUserResponse = await testUtils.createUser(user);

        try {
            await bus.request(constants.endpoints.service.UPDATE_USER, {
                data: { id: createdUserResponse.data.id, password: "new-password" }
            }, 1000);

            done.fail();
        } catch (err) {
            expect(err.status).toBe(400);
            expect(_.size(err.data)).toBe(0);
            done();
        }
    });

    it("should return error when trying to update email with faulty email", async done => {
        const user = mocks.getUserObject();
        const createdUserResponse = await testUtils.createUser(user);

        try {
            await bus.request(constants.endpoints.service.UPDATE_USER, {
                data: { id: createdUserResponse.data.id, email: "hello" }
            }, 1000);

            done.fail();
        } catch (err) {
            expect(err.status).toBe(400);
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
            await bus.request(constants.endpoints.service.UPDATE_USER, {
                data: { id: id, email: email }
            }, 1000);

            done.fail();
        } catch (err) {
            expect(err.status).toBe(400);
            done();
        }
    });

    it("should be possible to send old email with update request", async done => {
        const user = mocks.getUserObject();
        const email = user.email;

        const createdUserResponse = await testUtils.createUser(user);
        const id = createdUserResponse.data.id;
        user.email = email;

        const updateResponse = await bus.request(constants.endpoints.service.UPDATE_USER, {
            data: { id: id, email: email, firstName: "greg" }
        }, 1000);

        expect(updateResponse.status).toBe(200);
        done();
    });

    it("should not return error if no fields are updated", async done => {
        const user = mocks.getUserObject();
        const email = user.email;

        const createdUserResponse = await testUtils.createUser(user);
        const id = createdUserResponse.data.id;
        user.email = email;

        const updateResponse = await bus.request(constants.endpoints.service.UPDATE_USER, {
            data: { id: id, email: email, firstName: user.firstName, lastName: user.lastName }
        }, 1000);

        expect(updateResponse.status).toBe(200);
        done();
    });

    it("should resend verification mail when updating email if conf.requireEmailVerification is set to true", async (done) => {
        conf.requireEmailVerification = true;
        mocks.mockMailService();
        const user = mocks.getUserObject();
        const email = user.email;
        let id;

        const createdUserResponse = await testUtils.createUser(user);
        id = createdUserResponse.data.id;
        user.email = email;

        const updateResponse = await bus.request(constants.endpoints.service.UPDATE_USER, {
            data: {
                id: id,
                email: email,
                firstName: user.firstName,
                lastName: user.lastName
            }
        }, 1000);

        const testUser = await mongoDb.collection(conf.userCollection).findOne({ id: updateResponse.data.id });

        expect(updateResponse.status).toBe(200);
        expect(testUser.emailVerified).toBe(false, "updateResponse.data.emailVerified");
        expect(testUser.emailVerificationToken).toBeDefined("testUser.emailVerificationToken");
        conf.requireEmailVerification = false;

        done();
    });

});