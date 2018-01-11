const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const uuid = require("uuid");

const userService = require("../fruster-user-service");
const utils = require("../lib/utils/utils");
const config = require("../config");
const mocks = require("./support/mocks.js");
const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants.js");
const specConstants = require("./support/spec-constants");


describe("VerifyEmailAddressHandler", () => {

    /** @type {Db} */
    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => { db = connection.db; }));

    it("should remove emailVerificationToken and set emailVerified to true when verifying with emailVerificationToken", async (done) => {
        config.requireEmailVerification = true;

        const testUserData = mocks.getUserWithUnverifiedEmailObject();

        bus.subscribe("mail-service.send", (req) => {
            expect(req.data.from).toBe(config.emailVerificationFrom, "req.data.from");
            expect(req.data.to.includes(testUserData.email)).toBeTruthy("req.data.to.includes(testUserData.email)");
            return { reqId: req.reqId, status: 200 }
        });

        const createUserResponse = (await mocks.createUser(testUserData)).data;
        const testUser = await db.collection(config.userCollection).findOne({ id: createUserResponse.id });
        const verificationResponse = await bus.request({
            subject: constants.endpoints.http.VERIFY_EMAIL,
            skipOptionsRequest: true,
            message: {
                reqId: uuid.v4(),
                data: {},
                params: {
                    tokenId: testUser.emailVerificationToken
                }
            }
        });

        expect(verificationResponse.status).toBe(200, "verificationResponse.status");

        const updatedTestUser = await db.collection(config.userCollection).findOne({ id: createUserResponse.id });

        expect(updatedTestUser.emailVerificationToken).toBeUndefined("should remove emailVerificationToken");
        expect(updatedTestUser.emailVerified).toBe(true, "should set emailVerified to true");

        config.requireEmailVerification = false;
        done();
    });

    it("should use sendgrid mail template if specified in config", async (done) => {
        config.requireEmailVerification = true;
        config.emailVerificationEmailTempate = "band-ola";

        const testUserData = mocks.getUserWithUnverifiedEmailObject();

        bus.subscribe("mail-service.send", (req) => {
            expect(req.data.from).toBe(config.emailVerificationFrom);
            expect(req.data.to[0]).toBe(testUserData.email);
            expect(req.data.templateId).toBe(config.emailVerificationEmailTempate);
            config.requireEmailVerification = false;
            config.emailVerificationEmailTempate = undefined;

            done();
        });

        await mocks.createUser(testUserData);
    });

});