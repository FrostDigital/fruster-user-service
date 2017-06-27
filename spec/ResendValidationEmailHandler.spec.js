const nsc = require("nats-server-control");
const bus = require("fruster-bus");
const log = require("fruster-log");
const mongo = require("mongodb-bluebird");
const uuid = require("uuid");
const _ = require("lodash");

const userService = require('../fruster-user-service');
const utils = require('../lib/utils/utils');
const conf = require('../config');
const mocks = require('./support/mocks.js');
const testUtils = require('./support/test-utils.js');
const errors = require('../lib/errors.js');
const constants = require('../lib/constants.js');

let mongoDb;

describe("fruster user service resend verification email", () => {
    let server;
    const busPort = Math.floor(Math.random() * 6000 + 2000);
    const busAddress = "nats://localhost:" + busPort;
    const testDb = "user-service-test";
    const mongoUrl = "mongodb://localhost:27017/" + testDb;

    beforeAll(async (done) => {
        try {
            server = await nsc.startServer(busPort);
            await bus.connect(busAddress);
            mongoDb = await mongo.connect(mongoUrl);
            await userService.start(busAddress, mongoUrl);
            done();
        } catch (err) {
            log.error(err);
            done.fail();
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

        await bus.request(constants.endpoints.http.RESEND_VERIFICATION_EMAIL, {
            reqId: uuid.v4(), data: {}, params: { email: createUserResponse.email }
        });
    });

});