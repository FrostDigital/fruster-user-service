const log = require("fruster-log");
const uuid = require("uuid");
const conf = require('../config');
const mocks = require('./support/mocks.js');
const TestUtils = require('./support/TestUtils');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");
const errors = require('../lib/errors');


describe("UpdateUserHandler", () => {

    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => { db = connection.db; }));

    afterEach((done) => {
        conf.requireEmailVerification = false;
        conf.requirePasswordOnEmailUpdate = false;
        conf.optionalEmailVerification = false;
        conf.emailVerificationEmailTempate = undefined;

        done();
    });

    it("should return updated user when updating user", async done => {
        try {
            const user = mocks.getUserObject();
            const createdUserResponse = await TestUtils.createUser(user);
            const newFirstName = "Roland";
            const newLastName = "Svensson";
            const updateResponse = await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                data: { id: createdUserResponse.data.id, firstName: newFirstName, lastName: newLastName }
            });

            expect(updateResponse.data.firstName).toBe(newFirstName, "updateResponse.data.firstName");
            expect(updateResponse.data.lastName).toBe(newLastName, "updateResponse.data.lastName");

            const testUser = await db.collection(constants.collections.USERS).findOne({ id: updateResponse.data.id });

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
            const createdUserResponse = await TestUtils.createUser(user);
            const newFirstName = "Roland";
            const newLastName = "Svensson";
            const updateResponse = await TestUtils.busRequest({
                subject: constants.endpoints.http.admin.UPDATE_USER,
                user: { scopes: ["admin.*"] },
                data: { firstName: newFirstName, lastName: newLastName },
                params: { id: createdUserResponse.data.id }
            });

            expect(updateResponse.data.firstName).toBe(newFirstName, "updateResponse.data.firstName");
            expect(updateResponse.data.lastName).toBe(newLastName, "updateResponse.data.lastName");

            const testUser = await db.collection(constants.collections.USERS).findOne({ id: updateResponse.data.id });

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
            await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                data: { id: "ID_", email: "hello" }
            });

            done.fail();
        } catch (err) {
            expect(err.status).toBe(400, "err.status");
            done();
        }
    });

    it("should return error when trying to update password", async done => {
        const user = mocks.getUserObject();
        const createdUserResponse = await TestUtils.createUser(user);

        try {
            await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                data: { id: createdUserResponse.data.id, password: "new-password" }
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
        const createdUserResponse = await TestUtils.createUser(user);

        try {
            await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                data: { id: createdUserResponse.data.id, email: "hello" }
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

        const createdUserResponse = await TestUtils.createUser(user);
        const id = createdUserResponse.data.id;
        user.email = email;

        await TestUtils.createUser(user);

        try {
            await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                data: { id: id, email: email }
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

            const createdUserResponse = await TestUtils.createUser(user);
            const id = createdUserResponse.data.id;
            user.email = email;

            const updateResponse = await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                data: { id: id, email: email, firstName: "greg" }
            });

            expect(updateResponse.status).toBe(200, "updateResponse.status");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should require password when updating email if config.requirePasswordOnEmailUpdate is true", async done => {
        try {
            conf.requirePasswordOnEmailUpdate = true;

            const user = mocks.getUserObject();
            const email = "rambo.dreadlock@fejkmejl.se";

            const createdUserResponse = await TestUtils.createUser(user);
            const id = createdUserResponse.data.id;
            user.email = email;

            await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                data: { id, email }
            });

            done.fail();
        } catch (err) {
            expect(err.status).toBe(errors.get("PASSWORD_REQUIRED").status);
            expect(err.error.code).toBe(errors.get("PASSWORD_REQUIRED").error.code);

            done();
        }
    });

    it("should not be possible to provide incorrect password when updating email if config.requirePasswordOnEmailUpdate is true", async done => {
        try {
            conf.requirePasswordOnEmailUpdate = true;

            const user = mocks.getUserObject();
            const email = "rambo.dreadlock@fejkmejl.se";

            const createdUserResponse = await TestUtils.createUser(user);
            const id = createdUserResponse.data.id;
            user.email = email;

            await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                data: { id, email, password: "This is incorrect" }
            });
            done.fail();
        } catch (err) {
            expect(err.status).toBe(errors.get("UNAUTHORIZED").status);
            expect(err.error.code).toBe(errors.get("UNAUTHORIZED").error.code);

            done();
        }
    });

    it("should be possible to update email with correct password if config.requirePasswordOnEmailUpdate is true", async done => {
        try {
            conf.requirePasswordOnEmailUpdate = true;

            const user = mocks.getUserObject();
            const email = "rambo.dreadlock@fejkmejl.se";

            const createdUserResponse = await TestUtils.createUser(user);
            const id = createdUserResponse.data.id;
            user.email = email;

            const updateResponse = await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                data: { id, email, password: user.password }
            });

            expect(updateResponse.status).toBe(200, "updateResponse.status");
            expect(updateResponse.data.email).toBe(email, "updateResponse.data.email");

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

            const createdUserResponse = await TestUtils.createUser(user);
            const id = createdUserResponse.data.id;
            user.email = email;

            const updateResponse = await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                data: { id: id, email: email, firstName: user.firstName, lastName: user.lastName }
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

            const createdUserResponse = await TestUtils.createUser(user);
            id = createdUserResponse.data.id;
            user.email = email;

            const updateResponse = await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                data: { id: id, email: email, firstName: user.firstName, lastName: user.lastName }
            });

            const testUser = await db.collection(constants.collections.USERS).findOne({ id: updateResponse.data.id });

            expect(updateResponse.status).toBe(200, "updateResponse.status");
            expect(testUser.emailVerified).toBe(false, "updateResponse.data.emailVerified");
            expect(testUser.emailVerificationToken).toBeDefined("testUser.emailVerificationToken");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should resend verification mail when updating email if conf.requireEmailVerification is set to true and conf.emailVerificationEmailTempate and config.requirePasswordOnEmailUpdate set", async (done) => {
        try {
            conf.requireEmailVerification = true;
            conf.requirePasswordOnEmailUpdate = true;
            conf.emailVerificationEmailTempate = uuid.v4();

            const newEmail = "ram@ram.se";
            let invocations = 0;

            mocks.mockMailService(req => {
                /** The first time mail service will be contacted is when the user is created, so we only want check the second */
                if (invocations > 0) {
                    expect(req.data.templateArgs.user.email).toBe(newEmail, "req.data.templateArgs.user.email");
                    expect(req.data.templateArgs.user.firstName).toBe(user.firstName, "req.data.templateArgs.user.firstName");
                    expect(req.data.templateArgs.user.lastName).toBe(user.lastName, "req.data.templateArgs.user.lastName");
                }

                invocations++;
            });

            const user = mocks.getUserObject();
            const createdUserResponse = await TestUtils.createUser(user);
            const updateResponse = await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                skipOptionsRequest: true,
                data: { id: createdUserResponse.data.id, email: newEmail, firstName: user.firstName, lastName: user.lastName, password: user.password }
            });

            const testUser = await db.collection(constants.collections.USERS).findOne({ id: updateResponse.data.id });

            expect(updateResponse.status).toBe(200, "updateResponse.status");
            expect(testUser.emailVerified).toBe(false, "updateResponse.data.emailVerified");
            expect(testUser.emailVerificationToken).toBeDefined("testUser.emailVerificationToken");
            expect(invocations).toBeGreaterThan(0, "mail service invocations");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should resend verification mail when updating email if conf.optionalEmailVerification is set to true", async (done) => {
        try {
            conf.optionalEmailVerification = true;
            mocks.mockMailService();
            const user = mocks.getUserObject();
            const email = user.email;
            let id;

            const createdUserResponse = await TestUtils.createUser(user);
            id = createdUserResponse.data.id;
            user.email = email;

            const updateResponse = await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_USER,
                data: { id: id, email: email, firstName: user.firstName, lastName: user.lastName }
            });

            const testUser = await db.collection(constants.collections.USERS).findOne({ id: updateResponse.data.id });

            expect(updateResponse.status).toBe(200, "updateResponse.status");
            expect(testUser.emailVerified).toBe(false, "updateResponse.data.emailVerified");
            expect(testUser.emailVerificationToken).toBeDefined("testUser.emailVerificationToken");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});