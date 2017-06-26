const nsc = require("nats-server-control");
const bus = require("fruster-bus");
const log = require("fruster-log");
const mongo = require("mongodb-bluebird");
const uuid = require("uuid");
const _ = require("lodash");

const userService = require('../fruster-user-service');
const utils = require('../lib/utils/utils');
const conf = require('../config');
const mocks = require('./support/mocks.js');

let mongoDb;

describe("fruster user service create user", () => {
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

    it("should be possible to create user", async done => {
        mocks.mockMailService();
        try {
            const user = mocks.getUserObject();
            const response = await bus.request("user-service.create-user", {
                data: user
            }, 1000);

            expect(response.status).toBe(201);

            expect(_.size(response.data)).not.toBe(0);
            expect(_.size(response.error)).toBe(0);

            expect(response.data.firstName).toBe(user.firstName);
            expect(response.data.middleName).toBe(user.middleName);
            expect(response.data.lastName).toBe(user.lastName);
            expect(response.data.email).toBe(user.email);

            user.roles.forEach(role => {
                expect(response.data.scopes.length).toBe(_.size(utils.getRoles()[role.toLowerCase()]));
            });

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should not create the same role more than once when creating user", async done => {
        mocks.mockMailService();
        try {
            const user = mocks.getUserObject();
            user.roles.push("ADMIN");
            user.roles.push("admin");
            user.roles.push("adMin");
            user.roles.push("user");

            const response = await bus.request("user-service.create-user", {
                data: user
            }, 1000);

            expect(response.status).toBe(201);

            expect(_.size(response.data)).not.toBe(0);
            expect(_.size(response.error)).toBe(0);

            expect(response.data.roles.length).toBe(2);

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should validate password when creating user", async done => {
        mocks.mockMailService();
        const user = mocks.getUserObject();
        user.password = "hej";

        try {
            await bus.request("user-service.create-user", {
                data: user
            }, 1000);

            done.fail("should not be possible to create user with faulty password");
        } catch (err) {
            expect(err.status).toBe(400);

            expect(_.size(err.data)).toBe(0);
            expect(_.size(err.error)).not.toBe(0);

            done();
        }
    });

    it("should validate email when creating user", async done => {
        mocks.mockMailService();
        const user = mocks.getUserObject();
        user.email = "email";
        try {
            await bus.request("user-service.create-user", {
                data: user
            }, 1000);

            done.fail("should not be possible to create user with faulty email");
        } catch (err) {
            expect(err.status).toBe(400);

            expect(_.size(err.data)).toBe(0);
            expect(_.size(err.error)).not.toBe(0);

            done();
        }
    });

    it("should validate required fields when creating user", async done => {
        mocks.mockMailService();
        let user = mocks.getUserObject();
        delete user.firstName;
        await doRequest(user);

        user = mocks.getUserObject();
        delete user.lastName;
        await doRequest(user);

        user = mocks.getUserObject();
        delete user.email;
        await doRequest(user);

        user = mocks.getUserObject();
        delete user.password;
        await doRequest(user);

        user = mocks.getUserObject();
        delete user.lastName;
        await doRequest(user);

        done();

        function doRequest(userToCreate) {
            return new Promise(resolve => {
                bus.request("user-service.create-user", {
                    data: userToCreate
                }, 1000)
                    .catch(err => {
                        expect(err.status).toBe(400);

                        expect(_.size(err.data)).toBe(0);
                        expect(_.size(err.error)).not.toBe(0);

                        resolve();
                    });
            });
        }
    });

    it("should not require password to be set if configured not to", async done => {
        mocks.mockMailService();
        try {
            conf.requirePassword = false;

            const user = mocks.getUserObject();
            delete user.password;

            const savedUser = await bus.request("user-service.create-user", {
                data: user
            });

            expect(savedUser.data.id).toBeDefined();
            conf.requirePassword = true;

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should generate email validation token when config requireEmailValidation is true", async done => {
        mocks.mockMailService();
        try {
            conf.requireEmailValidation = true;

            const user = mocks.getUserObject();
            const response = await bus.request("user-service.create-user", {
                data: user
            }, 1000);

            expect(response.status).toBe(201);

            expect(_.size(response.data)).not.toBe(0);
            expect(_.size(response.error)).toBe(0);

            expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
            expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
            expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
            expect(response.data.email).toBe(user.email, "response.data.email");
            expect(response.data.emailValidated).toBe(false, "response.data.emailValidated");
            expect(response.data.emailValidationToken).toBeUndefined("response.data.emailValidationToken");

            const userFromDatabase = await (mongoDb.collection(conf.userCollection).findOne({ id: response.data.id }));
            expect(userFromDatabase.emailValidated).toBe(false, "userFromDatabase.emailValidated");
            expect(userFromDatabase.emailValidationToken).toBeDefined("userFromDatabase.emailValidationToken");

            user.roles.forEach(role => {
                expect(response.data.scopes.length).toBe(_.size(utils.getRoles()[role.toLowerCase()]));
            });

            conf.requireEmailValidation = false;
            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});