const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const errors = require("../lib/errors");
const userService = require("../fruster-user-service");
const config = require("../config");
const mocks = require("./support/mocks.js");
const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants.js");
const specConstants = require("./support/spec-constants");
const MailServiceClient = require("../lib/clients/MailServiceClient");
const SpecUtils = require("./support/SpecUtils");


describe("VerifyEmailAddressHandler", () => {

    /** @type {Db} */
    let db;
    let defaultRequireEmailVerification;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => { db = connection.db; }));

    beforeAll(() => {
        defaultRequireEmailVerification = config.requireEmailVerification;
        config.requireEmailVerification = true;
    });

    afterAll(() => {
        config.requireEmailVerification = defaultRequireEmailVerification;
        config.emailVerificationEmailTempate = undefined;
    });

    afterEach(() => {
        userService.stop();
    });

    it("should remove emailVerificationToken and set emailVerified to true when verifying with emailVerificationToken", async (done) => {
        try {
            const testUserData = mocks.getUserWithUnverifiedEmailObject();

            bus.subscribe(MailServiceClient.endpoints.SEND, (req) => {
                expect(req.data.from).toBe(config.emailVerificationFrom, "req.data.from");
                expect(req.data.to.includes(testUserData.email)).toBeTruthy("req.data.to.includes(testUserData.email)");
                return { reqId: req.reqId, status: 200 }
            });

            const createUserResponse = (await mocks.createUser(testUserData)).data;
            const testUser = await db.collection(constants.collections.USERS).findOne({ id: createUserResponse.id });
            const verificationResponse = await SpecUtils.busRequest({
                subject: constants.endpoints.http.VERIFY_EMAIL,
                params: { tokenId: testUser.emailVerificationToken }
            });

            expect(verificationResponse.status).toBe(200, "verificationResponse.status");

            const updatedTestUser = await db.collection(constants.collections.USERS).findOne({ id: createUserResponse.id });

            expect(updatedTestUser.emailVerificationToken).toBeUndefined("should remove emailVerificationToken");
            expect(updatedTestUser.emailVerified).toBe(true, "should set emailVerified to true");

            done();
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

    it("should not be able to verify email with faulty token", async (done) => {
        try {
            await SpecUtils.busRequest({
                subject: constants.endpoints.http.VERIFY_EMAIL,
                params: { tokenId: "ram.jam" }
            });

            done.fail();
        } catch (err) {
            expect(err.error.code).toBe(errors.get("INVALID_TOKEN").error.code);
            done();
        }
    });

    it("should use sendgrid mail template if specified in config", async (done) => {
        try {
            config.emailVerificationEmailTempate = "band-ola";

            const testUserData = mocks.getUserWithUnverifiedEmailObject();

            bus.subscribe(MailServiceClient.endpoints.SEND, (req) => {
                expect(req.data.from).toBe(config.emailVerificationFrom);
                expect(req.data.to[0]).toBe(testUserData.email);
                expect(req.data.templateId).toBe(config.emailVerificationEmailTempate);

                done();
            });

            await mocks.createUser(testUserData);
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

});