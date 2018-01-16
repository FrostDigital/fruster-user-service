const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const uuid = require("uuid");

const userService = require('../fruster-user-service');
const config = require('../config');
const mocks = require('./support/mocks.js');
const testUtils = require('./support/test-utils.js');
const errors = require('../lib/errors.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");


describe("ValidatePasswordHandler", () => {

    /** @type {Db} */
    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => { db = connection.db; }));

    afterEach(done => {
        config.requireEmailVerification = false;
        done();
    });

    it("should return 200 when validating correct password", async done => {
        try {
            const user = mocks.getUserObject();
            //@ts-ignore
            await db.dropDatabase(config.userCollection);
            await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });
            const response = await bus.request({
                subject: constants.endpoints.service.VALIDATE_PASSWORD,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        username: user.email,
                        password: user.password
                    }
                }
            });

            expect(response.status).toBe(200, "response.status");
            expect(response.error).toBeUndefined("response.error");

            done();
        } catch (err) {
            log.error(err);
            testUtils.fail(done, err);
        }
    });

    it("should return 200 when validating correct password without hashDate", async done => {
        try {
            const user = mocks.getOldUserObject();
            //@ts-ignore
            await db.dropDatabase(config.userCollection);
            await db.collection(config.userCollection).update({
                id: user.id
            }, user, {
                    upsert: true
                })

            const response = await bus.request({
                subject: constants.endpoints.service.VALIDATE_PASSWORD,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        username: user.email,
                        password: config.initialUserPassword
                    }
                }
            });

            expect(response.status).toBe(200, "response.status");
            expect(response.error).toBeUndefined("response.error");

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
            //@ts-ignore
            await db.dropDatabase(config.userCollection);
            await db.collection(config.userCollection).update({
                id: user.id
            }, user, {
                    upsert: true
                })

            const response = await bus.request({
                subject: constants.endpoints.service.VALIDATE_PASSWORD,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        username: user.email,
                        password: config.initialUserPassword
                    }
                }
            });

            expect(response.status).toBe(200, "response.status");
            expect(response.error).toBeUndefined("response.error");

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

            await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });
            const response = await bus.request({
                subject: constants.endpoints.service.VALIDATE_PASSWORD,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        username: "UrbAn@HeLlO.se",
                        password: user.password
                    }
                }
            });

            expect(response.status).toBe(200, "response.status");
            expect(response.error).toBeUndefined("response.error");

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
            await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });

            try {
                await bus.request({
                    subject: constants.endpoints.service.VALIDATE_PASSWORD,
                    skipOptionsRequest: true,
                    message: {
                        reqId: uuid.v4(),
                        data: {
                            username: user.email,
                            password: "yoyoyo"
                        }
                    }
                });
            } catch (err) {
                expect(err.status).toBe(401, "err.status");
                expect(err.data).toBeUndefined("err.data");

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
            config.requireEmailVerification = true;

            const user = mocks.getUserObject();

            await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });

            const response = await bus.request({
                subject: constants.endpoints.service.VALIDATE_PASSWORD,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        username: user.email,
                        password: user.password
                    }
                }
            });

            testUtils.fail(done, response);
        } catch (err) {
            expect(err.status).toBe(400, "err.status");
            expect(err.error.code).toBe(errors.get("EMAIL_NOT_VERIFIED").error.code, "err.error.code");

            config.requireEmailVerification = false;

            done();
        }
    });

    it("should be possible for old accounts to login even if the email has not been verified", async done => {
        try {
            mocks.mockMailService();

            const user = mocks.getUserObject();

            await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });

            config.requireEmailVerification = true;

            const response = await bus.request({
                subject: constants.endpoints.service.VALIDATE_PASSWORD,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: {
                        username: user.email,
                        password: user.password
                    }
                }
            });

            expect(response.status).toBe(200, "response.status");
            expect(response.error).toBeUndefined("response.error");

            config.requireEmailVerification = false;

            done();
        } catch (err) {
            testUtils.fail(done, err);
        }
    });

});