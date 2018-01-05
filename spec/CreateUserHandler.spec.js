const nsc = require("nats-server-control");
const bus = require("fruster-bus");
const log = require("fruster-log");
const mongo = require("mongodb");
const uuid = require("uuid");
const _ = require("lodash");

const userService = require("../fruster-user-service");
const utils = require("../lib/utils/utils");
const conf = require("../config");
const mocks = require("./support/mocks.js");
const constants = require("../lib/constants.js");
const testUtils = require("./support/test-utils.js");
const frusterTestUtils = require("fruster-test-utils");
const roleUtils = require("../lib/utils/role-utils");


describe("CreateUserHandler", () => {

    let mongoDb;

    frusterTestUtils.startBeforeEach({
        mockNats: true,
        mongoUrl: "mongodb://localhost:27017/user-service-test",
        service: userService,
        afterStart: (connection) => {
            mongoDb = connection.db;
        }
    });

    it("should be possible to create user", async done => {
        mocks.mockMailService();
        try {
            const user = mocks.getUserObject();
            user.roles.push("super-admin");

            const response = await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });

            expect(response.status).toBe(201);

            expect(_.size(response.data)).not.toBe(0);
            expect(_.size(response.error)).toBe(0);

            expect(response.data.firstName).toBe(user.firstName);
            expect(response.data.middleName).toBe(user.middleName);
            expect(response.data.lastName).toBe(user.lastName);
            expect(response.data.email).toBe(user.email);

            const roles = roleUtils.getRoles();
            const currentRoleScopes = [];

            Object.keys(roles)
                .forEach(role => {
                    roles[role].forEach(scope => {
                        if (!currentRoleScopes.includes(scope))
                            currentRoleScopes.push(scope);
                    });
                });

            expect(response.data.scopes.length).toBe(currentRoleScopes.length, "response.data.scopes.length");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should be possible to create user with custom fields", async done => {
        mocks.mockMailService();
        try {
            const user = mocks.getUserObject();
            user.roles.push("super-admin");

            /** Custom fields */
            user.profileImage = "http://pipsum.com/435x310.jpg";
            user.custom = "field";

            const response = await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });

            expect(response.status).toBe(201, "response.status");

            expect(_.size(response.data)).not.toBe(0, "_.size(response.data)");
            expect(_.size(response.error)).toBe(0, "_.size(response.error)");

            expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
            expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
            expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
            expect(response.data.email).toBe(user.email, "response.data.email");
            expect(response.data.profileImage).toBe(user.profileImage, "response.data.profileImage");
            expect(response.data.custom).toBe(user.custom, "response.data.custom");

            const roles = roleUtils.getRoles();
            const currentRoleScopes = [];

            Object.keys(roles)
                .forEach(role => {
                    roles[role].forEach(scope => {
                        if (!currentRoleScopes.includes(scope))
                            currentRoleScopes.push(scope);
                    });
                });

            expect(response.data.scopes.length).toBe(currentRoleScopes.length, "response.data.scopes.length");

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
            user.roles.push("admin");
            user.roles.push("admin");
            user.roles.push("admin");
            user.roles.push("user");

            const response = await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });

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
            await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });

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
            await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });

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
                bus.request({
                    subject: constants.endpoints.service.CREATE_USER,
                    timeout: 1000,
                    skipOptionsRequest: true,
                    message: {
                        reqId: uuid.v4(),
                        data: userToCreate
                    }
                })
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

            const savedUser = await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });

            expect(savedUser.data.id).toBeDefined();
            conf.requirePassword = true;

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should generate email verification token when config requireEmailVerification is true", async done => {
        mocks.mockMailService();
        try {
            conf.requireEmailVerification = true;

            const user = mocks.getUserObject();
            const response = await bus.request({
                subject: constants.endpoints.service.CREATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    reqId: uuid.v4(),
                    data: user
                }
            });

            expect(response.status).toBe(201);

            expect(_.size(response.data)).not.toBe(0);
            expect(_.size(response.error)).toBe(0);

            expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
            expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
            expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
            expect(response.data.email).toBe(user.email, "response.data.email");
            expect(response.data.emailVerified).toBe(false, "response.data.emailVerified");
            expect(response.data.emailVerificationToken).toBeUndefined("response.data.emailVerificationToken");

            const userFromDatabase = await (mongoDb.collection(conf.userCollection).findOne({ id: response.data.id }));
            expect(userFromDatabase.emailVerified).toBe(false, "userFromDatabase.emailVerified");
            expect(userFromDatabase.emailVerificationToken).toBeDefined("userFromDatabase.emailVerificationToken");

            user.roles.forEach(role => {
                expect(response.data.scopes.length).toBe(_.size(roleUtils.getRoles()[role.toLowerCase()]));
            });

            conf.requireEmailVerification = false;
            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should not allow multiple users with the same email to be created", async done => {
        mocks.mockMailService();
        const user = mocks.getUserObject();
        await testUtils.createUser(user);

        try {
            await Promise.all([
                testUtils.createUser(user),
                testUtils.createUser(user),
                testUtils.createUser(user),
                testUtils.createUser(user),
                testUtils.createUser(user),
                testUtils.createUser(user),
                testUtils.createUser(user)
            ]);

            done.fail();
        } catch (err) {
            expect(err.status).toBe(400);

            expect(_.size(err.data)).toBe(0);
            expect(_.size(err.error)).not.toBe(0);

            done();
        }
    });

});