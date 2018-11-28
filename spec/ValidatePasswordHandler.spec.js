const Db = require("mongodb").Db;
const config = require('../config');
const mocks = require('./support/mocks.js');
const errors = require('../lib/errors.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");


describe("ValidatePasswordHandler", () => {

    /** @type {Db} */
    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => db = connection.db));

    afterEach(() => SpecUtils.resetConfig());

    it("should return 200 when validating correct password", async () => {
        const user = mocks.getUserObject();
        //@ts-ignore
        await db.dropDatabase(constants.collections.USERS);
        await SpecUtils.busRequest({
            subject: constants.endpoints.service.CREATE_USER,
            data: user
        });

        const response = await SpecUtils.busRequest({
            subject: constants.endpoints.service.VALIDATE_PASSWORD,
            data: { username: user.email, password: user.password }
        });

        expect(response.status).toBe(200, "response.status");
        expect(response.error).toBeUndefined("response.error");
    });

    it("should return 200 when validating correct password without hashDate", async () => {
        const user = mocks.getOldUserObject();
        //@ts-ignore
        await db.dropDatabase(constants.collections.USERS);
        await db.collection(constants.collections.USERS).update({ id: user.id }, user, { upsert: true })

        const response = await SpecUtils.busRequest({
            subject: constants.endpoints.service.VALIDATE_PASSWORD,
            data: { username: user.email, password: config.initialUserPassword }
        });

        expect(response.status).toBe(200, "response.status");
        expect(response.error).toBeUndefined("response.error");
    });

    it("should return 200 when validating correct password old hashDate", async () => {
        const user = mocks.getOldUserObject();
        user.hashDate = new Date("1970");
        //@ts-ignore
        await db.dropDatabase(constants.collections.USERS);
        await db.collection(constants.collections.USERS).update({ id: user.id }, user, { upsert: true })

        const response = await SpecUtils.busRequest({
            subject: constants.endpoints.service.VALIDATE_PASSWORD,
            data: { username: user.email, password: config.initialUserPassword }
        });

        expect(response.status).toBe(200, "response.status");
        expect(response.error).toBeUndefined("response.error");
    });

    it("should be possible to login with non case sensitive username", async () => {
        mocks.mockMailService();

        const user = mocks.getUserObject();
        user.email = "urban@hello.se";

        await SpecUtils.busRequest({
            subject: constants.endpoints.service.CREATE_USER,
            data: user
        });

        const response = await SpecUtils.busRequest({
            subject: constants.endpoints.service.VALIDATE_PASSWORD,
            data: { username: "UrbAn@HeLlO.se", password: user.password }
        });

        expect(response.status).toBe(200, "response.status");
        expect(response.error).toBeUndefined("response.error");
    });

    it("should return 401 when validating incorrect password", async done => {
        mocks.mockMailService();

        const user = mocks.getUserObject();
        await SpecUtils.busRequest({
            subject: constants.endpoints.service.CREATE_USER,
            data: user
        });

        try {
            await SpecUtils.busRequest({
                subject: constants.endpoints.service.VALIDATE_PASSWORD,
                data: { username: user.email, password: "yoyoyo" }
            });
        } catch (err) {
            expect(err.status).toBe(401, "err.status");
            expect(err.data).toBeUndefined("err.data");

            done();
        }
    });

    it("should not be possible to login using an incomplete email", async done => {
        mocks.mockMailService();

        const user = mocks.getUserObject();
        await SpecUtils.busRequest({
            subject: constants.endpoints.service.CREATE_USER,
            data: user
        });

        let email = user.email;
        email = email.substring(0, email.indexOf("@"));

        try {
            await SpecUtils.busRequest({
                subject: constants.endpoints.service.VALIDATE_PASSWORD,
                data: { username: email, password: user.password }
            });

            done.fail();
        } catch (err) {
            expect(err.status).toBe(401, "err.status");
            expect(err.data).toBeUndefined("err.data");

            done();
        }
    });

    it("should return 400 when user without verified email logs in with config.requireEmailVerification set to true", async done => {
        mocks.mockMailService();
        config.requireEmailVerification = true;

        const user = mocks.getUserObject();

        await SpecUtils.busRequest({
            subject: constants.endpoints.service.CREATE_USER,
            data: user
        });

        try {
            await SpecUtils.busRequest({
                subject: constants.endpoints.service.VALIDATE_PASSWORD,
                data: { username: user.email, password: user.password }
            });

            done.fail();
        } catch (err) {
            expect(err.status).toBe(400, "err.status");
            expect(err.error.code).toBe(errors.get("fruster-user-service.EMAIL_NOT_VERIFIED").error.code, "err.error.code");

            config.requireEmailVerification = false;

            done();
        }
    });

    it("should be possible for to login even if the email has not been verified but config.optionalEmailVerification is set to true", async () => {
        mocks.mockMailService();

        const user = mocks.getUserObject();

        await SpecUtils.busRequest({
            subject: constants.endpoints.service.CREATE_USER,
            data: user
        });

        config.optionalEmailVerification = true;

        const response = await SpecUtils.busRequest({
            subject: constants.endpoints.service.VALIDATE_PASSWORD,
            data: { username: user.email, password: user.password }
        });

        expect(response.status).toBe(200, "response.status");
        expect(response.error).toBeUndefined("response.error");

        config.optionalEmailVerification = false;
    });

    it("should be possible for old accounts to login even if the email has not been verified", async () => {
        mocks.mockMailService();

        const user = mocks.getUserObject();

        await SpecUtils.busRequest({
            subject: constants.endpoints.service.CREATE_USER,
            data: user
        });

        config.requireEmailVerification = true;

        const response = await SpecUtils.busRequest({
            subject: constants.endpoints.service.VALIDATE_PASSWORD,
            data: { username: user.email, password: user.password }
        });

        expect(response.status).toBe(200, "response.status");
        expect(response.error).toBeUndefined("response.error");

        config.requireEmailVerification = false;
    });

});