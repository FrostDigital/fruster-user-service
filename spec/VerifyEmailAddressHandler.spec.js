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
const testUtils = require("fruster-test-utils");
const errors = require("../lib/errors.js");
const constants = require("../lib/constants.js");


describe("VerifyEmailAddressHandler", () => {

    let mongoDb;

    testUtils.startBeforeEach({
        mockNats: true,
        mongoUrl: "mongodb://localhost:27017/user-service-test",
        service: userService,
        afterStart: (connection) => {
            mongoDb = connection.db;
        }
    });

    it("should remove emailVerificationToken and set emailVerified to true when verifying with emailVerificationToken", async (done) => {
        conf.requireEmailVerification = true;

        const testUserData = mocks.getUserWithUnverifiedEmailObject();

        bus.subscribe("mail-service.send", (req) => {
            expect(req.data.from).toBe(conf.emailVerificationFrom, "req.data.from");
            expect(req.data.to.includes(testUserData.email)).toBeTruthy("req.data.to.includes(testUserData.email)");
            return { reqId: req.reqId, status: 200 }
        });

        const createUserResponse = (await mocks.createUser(testUserData)).data;
        const testUser = await mongoDb.collection(conf.userCollection).findOne({ id: createUserResponse.id });
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

        const updatedTestUser = await mongoDb.collection(conf.userCollection).findOne({ id: createUserResponse.id });

        expect(updatedTestUser.emailVerificationToken).toBeUndefined("should remove emailVerificationToken");
        expect(updatedTestUser.emailVerified).toBe(true, "should set emailVerified to true");

        conf.requireEmailVerification = false;
        done();
    });

    it("should use sendgrid mail template if specified in config", async (done) => {
        conf.requireEmailVerification = true;
        conf.emailVerificationEmailTempate = "band-ola";

        const testUserData = mocks.getUserWithUnverifiedEmailObject();

        bus.subscribe("mail-service.send", (req) => {
            expect(req.data.from).toBe(conf.emailVerificationFrom);
            expect(req.data.to[0]).toBe(testUserData.email);
            expect(req.data.templateId).toBe(conf.emailVerificationEmailTempate);
            conf.requireEmailVerification = false;
            conf.emailVerificationEmailTempate = undefined;

            done();
        });

        await mocks.createUser(testUserData);
    });

});