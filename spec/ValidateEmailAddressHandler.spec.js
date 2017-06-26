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

describe("fruster user service validate email address", () => {
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

    it("should remove emailValidationToken and set emailValidated to true when validating with emailValidationToken", async (done) => {
        conf.requireEmailValidation = true;

        const testUserData = mocks.getUserWithUnvalidatedEmailObject();

        bus.subscribe("mail-service.send", (req) => {
            expect(req.data.from).toBe(conf.emailValidationFrom);
            expect(req.data.to[0]).toBe(testUserData.email);
            return { reqId: req.reqId, status: 200 }
        });

        const createUserResponse = (await mocks.createUser(testUserData)).data;
        const testUser = await mongoDb.collection(conf.userCollection).findOne({ id: createUserResponse.id });
        const validationResponse = await bus.request(constants.endpoints.http.VERIFY_EMAIL, {
            reqId: uuid.v4(),
            data: {},
            params: {
                tokenId: testUser.emailValidationToken
            }
        });

        expect(validationResponse.status).toBe(200, "validationResponse.status");

        const updatedTestUser = await mongoDb.collection(conf.userCollection).findOne({ id: createUserResponse.id });

        expect(updatedTestUser.emailValidationToken).toBeUndefined("Should remove emailValidationToken");
        expect(updatedTestUser.emailValidated).toBe(true, "Should set emailValidated to true");

        conf.requireEmailValidation = false;
        done();
    });

});