const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const uuid = require("uuid");

const conf = require("../config");
const mocks = require("./support/mocks.js");
const constants = require("../lib/constants.js");
const testUtils = require("./support/test-utils.js");
const frusterTestUtils = require("fruster-test-utils");
const RoleManager = require("../lib/managers/RoleManager");
const RoleScopesConfigRepo = require("../lib/repos/RoleScopesConfigRepo");
const specConstants = require("./support/spec-constants");


describe("CreateUserHandler", () => {

    /** @type {RoleManager} */
    let roleManager;

    /** @type {Db} */
    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions(async connection => {
                db = connection.db;
                const roleScopesConfigRepo = new RoleScopesConfigRepo();
                await roleScopesConfigRepo.prepareRoles();
                roleManager = new RoleManager(roleScopesConfigRepo);
            }));

    afterEach((done) => {
        conf.requireEmailVerification = false;
        conf.optionalEmailVerification = false;
        conf.requirePassword = true;
        conf.emailVerificationForRoles = ["*"];

        done();
    });

    fit("should be possible to create user", async done => {
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

            expect(response.status).toBe(201, "response.status");

            expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
            expect(response.error).toBeUndefined("response.error");

            expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
            expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
            expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
            expect(response.data.email).toBe(user.email, "response.data.email");

            const roles = await roleManager.getRoles();
            const currentRoleScopes = [];

            Object.keys(roles)
                .forEach(role => {
                    roles[role].forEach(scope => {
                        if (!currentRoleScopes.includes(scope))
                            currentRoleScopes.push(scope);
                    });
                });
            console.log("\n");
            console.log("=======================================");
            console.log("response");
            console.log("=======================================");
            console.log(require("util").inspect(response, null, null, true));
            console.log("\n");

            expect(response.data.scopes.length).toBe(currentRoleScopes.length, "response.data.scopes.length");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should be possible to create user via http", async done => {
        mocks.mockMailService();

        try {
            const user = mocks.getUserObject();
            user.roles.push("super-admin");

            const response = await bus.request({
                subject: constants.endpoints.http.admin.CREATE_USER,
                timeout: 1000,
                skipOptionsRequest: true,
                message: {
                    user: { scopes: ["admin.*"] },
                    reqId: uuid.v4(),
                    data: user
                }
            });

            expect(response.status).toBe(201, "response.status");

            expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
            expect(response.error).toBeUndefined("response.error");

            expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
            expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
            expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
            expect(response.data.email).toBe(user.email, "response.data.email");

            const roles = await roleManager.getRoles();
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

            expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
            expect(response.error).toBeUndefined("response.error");

            expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
            expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
            expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
            expect(response.data.email).toBe(user.email, "response.data.email");
            expect(response.data.profileImage).toBe(user.profileImage, "response.data.profileImage");
            expect(response.data.custom).toBe(user.custom, "response.data.custom");

            const roles = await roleManager.getRoles();
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

            expect(response.status).toBe(201, "response.status");

            expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
            expect(response.error).toBeUndefined("response.error");

            expect(response.data.roles.length).toBe(2, "response.data.roles.length");

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
            expect(err.status).toBe(400, "err.statu");

            expect(err.data).toBeUndefined("err.data");
            expect(Object.keys(err.error).length).not.toBe(0, "Object.keys(err.error).length");

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
            expect(err.status).toBe(400, "err.status");

            expect(err.data).toBeUndefined("err.data");
            expect(Object.keys(err.error).length).not.toBe(0);

            done();
        }
    });

    it("should validate required fields when creating user", async done => {
        try {
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
        } catch (err) {
            log.error(err);
            done.fail(err);
        }

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
                        expect(err.status).toBe(400, "err.status");

                        expect(err.data).toBeUndefined("err.data");
                        expect(Object.keys(err.error).length).not.toBe(0, "Object.keys(err.error).length");

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

            expect(savedUser.data.id).toBeDefined("savedUser.data.id");

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

            expect(response.status).toBe(201, "response.status");

            expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
            expect(response.error).toBeUndefined("response.error");

            expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
            expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
            expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
            expect(response.data.email).toBe(user.email, "response.data.email");
            expect(response.data.emailVerified).toBe(false, "response.data.emailVerified");
            expect(response.data.emailVerificationToken).toBeUndefined("response.data.emailVerificationToken");

            const userFromDatabase = await (db.collection(conf.userCollection).findOne({ id: response.data.id }));
            expect(userFromDatabase.emailVerified).toBe(false, "userFromDatabase.emailVerified");
            expect(userFromDatabase.emailVerificationToken).toBeDefined("userFromDatabase.emailVerificationToken");

            const roles = await roleManager.getRoles();

            user.roles.forEach(role => {
                expect(response.data.scopes.length).toBe(Object.keys(roles[role.toLowerCase()]).length);
            });

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should generate email verification token when config requireEmailVerification is true and emailVerificationForRoles has role admin", async done => {
        mocks.mockMailService();

        try {
            conf.requireEmailVerification = true;
            conf.emailVerificationForRoles = ["admin"]

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

            expect(response.status).toBe(201, "response.status");

            expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
            expect(response.error).toBeUndefined("response.error");

            expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
            expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
            expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
            expect(response.data.email).toBe(user.email, "response.data.email");
            expect(response.data.emailVerified).toBe(false, "response.data.emailVerified");
            expect(response.data.emailVerificationToken).toBeUndefined("response.data.emailVerificationToken");

            const userFromDatabase = await (db.collection(conf.userCollection).findOne({ id: response.data.id }));
            expect(userFromDatabase.emailVerified).toBe(false, "userFromDatabase.emailVerified");
            expect(userFromDatabase.emailVerificationToken).toBeDefined("userFromDatabase.emailVerificationToken");

            const roles = await roleManager.getRoles();

            user.roles.forEach(role => {
                expect(response.data.scopes.length).toBe(Object.keys(roles[role.toLowerCase()]).length);
            });

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should not generate email verification token when config requireEmailVerification is true and emailVerificationForRoles does not have role admin", async done => {
        mocks.mockMailService();

        try {
            conf.requireEmailVerification = true;
            conf.emailVerificationForRoles = ["user", "super-admin", "ramjam"]

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

            expect(response.status).toBe(201, "response.status");

            expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
            expect(response.error).toBeUndefined("response.error");

            expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
            expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
            expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
            expect(response.data.email).toBe(user.email, "response.data.email");
            expect(response.data.emailVerified).toBeTruthy("response.data.emailVerified");
            expect(response.data.emailVerificationToken).toBeUndefined("response.data.emailVerificationToken");

            const userFromDatabase = await (db.collection(conf.userCollection).findOne({ id: response.data.id }));

            expect(userFromDatabase.emailVerified).toBeTruthy("userFromDatabase.emailVerified");
            expect(userFromDatabase.emailVerificationToken).toBeUndefined("userFromDatabase.emailVerificationToken");

            const roles = await roleManager.getRoles();

            user.roles.forEach(role => {
                expect(response.data.scopes.length).toBe(Object.keys(roles[role.toLowerCase()]).length);
            });

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should generate email verification token when config optionalEmailVerification is true", async done => {
        mocks.mockMailService();
        try {
            conf.optionalEmailVerification = true;

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

            expect(response.status).toBe(201, "response.status");

            expect(Object.keys(response.data).length).not.toBe(0, "Object.keys(response.data).length");
            expect(response.error).toBeUndefined("response.error");

            expect(response.data.firstName).toBe(user.firstName, "response.data.firstName");
            expect(response.data.middleName).toBe(user.middleName, "response.data.middleName");
            expect(response.data.lastName).toBe(user.lastName, "response.data.lastName");
            expect(response.data.email).toBe(user.email, "response.data.email");
            expect(response.data.emailVerified).toBe(false, "response.data.emailVerified");
            expect(response.data.emailVerificationToken).toBeUndefined("response.data.emailVerificationToken");

            const userFromDatabase = await (db.collection(conf.userCollection).findOne({ id: response.data.id }));
            expect(userFromDatabase.emailVerified).toBe(false, "userFromDatabase.emailVerified");
            expect(userFromDatabase.emailVerificationToken).toBeDefined("userFromDatabase.emailVerificationToken");

            const roles = await roleManager.getRoles();

            user.roles.forEach(role => {
                expect(response.data.scopes.length).toBe(Object.keys(roles[role.toLowerCase()]).length);
            });

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
            expect(err.status).toBe(400, "err.status");

            expect(err.data).toBeUndefined("err.data");
            expect(Object.keys(err.error).length).not.toBe(0, "Object.keys(err.error).length");

            done();
        }
    });

});