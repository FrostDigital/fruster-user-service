const bus = require("fruster-bus");
const Db = require("mongodb").Db;
const uuid = require("uuid");

const userService = require('../fruster-user-service');
const conf = require('../config');
const mocks = require('./support/mocks.js');
const testUtils = require('./support/test-utils.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");


describe("ResendVerificationEmailHandler", () => {

    /** @type {Db} */
    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => { db = connection.db; }));

    afterEach((done) => {
        conf.requireEmailVerification = false;
        done();
    });

    it("should resend email", async (done) => {
        conf.requireEmailVerification = true;

        const testUserData = mocks.getUserWithUnverifiedEmailObject();
        let verificationToken;
        let initialUserCreated = false;

        bus.subscribe({
            subject: "mail-service.send",
            handle: (req) => {
                if (initialUserCreated) {
                    expect(req.data.message.includes(verificationToken)).toBe(false, "req.data.message.includes(verificationToken)");
                    expect(req.data.from).toBe(conf.emailVerificationFrom, "req.data.from");
                    expect(req.data.to[0]).toBe(testUserData.email, "req.data.to[0]");

                    done();
                } else {
                    initialUserCreated = true;
                }

                conf.requireEmailVerification = false;

                return { reqId: req.reqId, status: 200 };
            }
        });

        const createUserResponse = (await mocks.createUser(testUserData)).data;
        const testUser = await db.collection(conf.userCollection).findOne({ id: createUserResponse.id });

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