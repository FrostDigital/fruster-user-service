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
const errors = require('../lib/errors.js');
const constants = require('../lib/constants.js');

let mongoDb;

describe("fruster user service validate password", () => {
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

    it("should return 200 when validating correct password", async done => {
        try {
            const user = mocks.getUserObject();
            await mongoDb.dropDatabase(conf.userCollection);
            await bus.request(constants.endpoints.service.CREATE_USER, { data: user });
            const response = await bus.request(constants.endpoints.service.VALIDATE_PASSWORD,
                { data: { username: user.email, password: user.password } });

            expect(response.status).toBe(200);
            expect(_.size(response.error)).toBe(0);

            done();
        } catch (err) {
            log.error(err);
            testUtils.fail(done, err);
        }
    });

    it("should return 200 when validating correct password without hashDate", async done => {
        try {
            const user = mocks.getOldUserObject();
            await mongoDb.dropDatabase(conf.userCollection);
            await mongoDb.collection(conf.userCollection).update({ id: user.id }, user, { upsert: true })

            const response = await bus.request(constants.endpoints.service.VALIDATE_PASSWORD,
                { data: { username: user.email, password: conf.initialUserPassword } });

            expect(response.status).toBe(200);
            expect(_.size(response.error)).toBe(0);

            done();
        } catch (err) {
            log.error(err);
            testUtils.fail(done, err);
        }
    });

    it("should return 200 when validating correct password old hashDate", async done => {
        try {
            const user = mocks.getOldUserObject();
            user.hashDate = new Date("1970");
            await mongoDb.dropDatabase(conf.userCollection);
            await mongoDb.collection(conf.userCollection).update({ id: user.id }, user, { upsert: true })

            const response = await bus.request(constants.endpoints.service.VALIDATE_PASSWORD,
                { data: { username: user.email, password: conf.initialUserPassword } });

            expect(response.status).toBe(200);
            expect(_.size(response.error)).toBe(0);

            done();
        } catch (err) {
            log.error(err);
            testUtils.fail(done, err);
        }
    });

    it("should be possible to login with non case sensitive username", async done => {
        try {
            mocks.mockMailService();
            const user = mocks.getUserObject();
            user.email = "urban@hello.se";

            await bus.request(constants.endpoints.service.CREATE_USER, { data: user });
            const response = await bus.request(constants.endpoints.service.VALIDATE_PASSWORD,
                { data: { username: "UrbAn@HeLlO.se", password: user.password } });

            expect(response.status).toBe(200);
            expect(_.size(response.error)).toBe(0);

            done();
        } catch (err) {
            log.error(err);
            testUtils.fail(done, err);
        }
    });

    it("should return 401 when validating incorrect password", async done => {
        try {
            mocks.mockMailService();
            const user = mocks.getUserObject();
            await bus.request(constants.endpoints.service.CREATE_USER, { data: user });

            try {
                await bus.request(constants.endpoints.service.VALIDATE_PASSWORD, { data: { username: user.email, password: "yoyoyo" } });
            } catch (err) {
                expect(err.status).toBe(401);
                expect(_.size(err.data)).toBe(0);

                done();
            }
        } catch (err) {
            log.error(err);
            testUtils.fail(done, err);
        }
    });

    it("should return 400 when user without verified email logs in with config.requireEmailVerification set to true", async done => {
        try {
            mocks.mockMailService();
            conf.requireEmailVerification = true;

            const user = mocks.getUserObject();
            user.emailVerified = false;

            await bus.request(constants.endpoints.service.CREATE_USER, { data: user });
            const response = await bus.request(constants.endpoints.service.VALIDATE_PASSWORD,
                { data: { username: user.email, password: user.password } });

            testUtils.fail(done, response);
        } catch (err) {
            expect(err.status).toBe(400);
            expect(err.error.code).toBe(errors.get("EMAIL_NOT_VERIFIED").error.code);

            done();
            conf.requireEmailVerification = false;
        }
    });

});