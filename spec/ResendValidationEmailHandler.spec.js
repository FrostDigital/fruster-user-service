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

describe("fruster user service resend validation email", () => {
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
        conf.requireEmailValidation = true;

        const testUserData = mocks.getUserWithUnvalidatedEmailObject();
        let validationToken;
        let initialUserCreated = false;

        bus.subscribe("mail-service.send", (req) => {
            if (initialUserCreated) {
                expect(req.data.message.includes(validationToken)).toBe(false, "should generate new validation token");
                expect(req.data.from).toBe(conf.emailValidationFrom, "req.data.from");
                expect(req.data.to[0]).toBe(testUserData.email, "req.data.to[0]");

                done();
            } else {
                initialUserCreated = true;
            }

            return { reqId: req.reqId, status: 200 };
        });

        const createUserResponse = (await mocks.createUser(testUserData)).data;
        const testUser = await mongoDb.collection(conf.userCollection).findOne({ id: createUserResponse.id });

        validationToken = testUser.emailValidationToken;

        const validationResponse = await bus.request(constants.endpoints.http.RESEND_VALIDATION_EMAIL, {
            reqId: uuid.v4(), data: {}, params: { email: createUserResponse.email }
        });
    });

});