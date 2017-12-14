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
const frusterTestUtils = require("fruster-test-utils");


describe("ResendVerificationEmailHandler", () => {

    let mongoDb;

    frusterTestUtils.startBeforeEach({
        mockNats: true,
        mongoUrl: "mongodb://localhost:27017/user-service-test",
        service: userService,
        afterStart: (connection) => {
            mongoDb = connection.db;
        }
    });

    it("should resend email", async (done) => {
        conf.requireEmailVerification = true;

        const testUserData = mocks.getUserWithUnverifiedEmailObject();
        let verificationToken;
        let initialUserCreated = false;

        bus.subscribe("mail-service.send", (req) => {
            if (initialUserCreated) {
                expect(req.data.message.includes(verificationToken)).toBe(false, "should generate new verification token");
                expect(req.data.from).toBe(conf.emailVerificationFrom, "req.data.from");
                expect(req.data.to[0]).toBe(testUserData.email, "req.data.to[0]");

                done();
            } else {
                initialUserCreated = true;
            }

            conf.requireEmailVerification = false;

            return { reqId: req.reqId, status: 200 };
        });

        const createUserResponse = (await mocks.createUser(testUserData)).data;
        const testUser = await mongoDb.collection(conf.userCollection).findOne({ id: createUserResponse.id });

        verificationToken = testUser.emailVerificationToken;

        await bus.request({
            subject: constants.endpoints.http.RESEND_VERIFICATION_EMAIL,
            skipOptionsRequest: true,
            message: {
                reqId: uuid.v4(), data: {}, params: { email: createUserResponse.email }
            }
        });
    });

});