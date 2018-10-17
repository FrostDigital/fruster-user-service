const bus = require("fruster-bus");
const Db = require("mongodb").Db;
const conf = require('../config');
const mocks = require('./support/mocks.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");
const SpecUtils = require("./support/SpecUtils");


describe("ResendVerificationEmailHandler", () => {

    /** @type {Db} */
    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => db = connection.db));

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
                } else
                    initialUserCreated = true;

                conf.requireEmailVerification = false;

                return { reqId: req.reqId, status: 200 };
            }
        });

        const createUserResponse = (await mocks.createUser(testUserData)).data;
        const testUser = await db.collection(constants.collections.USERS).findOne({ id: createUserResponse.id });

        verificationToken = testUser.emailVerificationToken;

        await SpecUtils.busRequest({
            subject: constants.endpoints.http.RESEND_VERIFICATION_EMAIL,
            data: {},
            params: { email: createUserResponse.email }
        });
    });

});