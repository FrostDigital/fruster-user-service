const bus = require("fruster-bus");
const log = require("fruster-log");
const Db = require("mongodb").Db;
const uuid = require("uuid");
const config = require("../config");

const userService = require('../fruster-user-service');
const testUtils = require('./support/test-utils.js');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const mocks = require("./support/mocks");
const specConstants = require("./support/spec-constants");


describe("DeleteUserHandler", () => {

    /** @type {Db} */
    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => { db = connection.db; }));

    it("should return 200 when user is successfully removed", async done => {
        try {
            const user = mocks.getUserObject();
            const createdUserResponse = await testUtils.createUser(user);
            const deleteResponse = await bus.request({
                subject: constants.endpoints.service.DELETE_USER,
                skipOptionsRequest: true,
                timeout: 1000,
                message: {
                    reqId: uuid.v4(),
                    data: { id: createdUserResponse.data.id }
                }
            });


            expect(deleteResponse.status).toBe(200, "deleteResponse.status");

            const userInDatabase = await db.collection(config.userCollection).findOne({ id: createdUserResponse.data.id });
            expect(userInDatabase).toBe(null, "userInDatabase");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should return 200 when user is successfully removed via http", async done => {
        try {
            const user = mocks.getUserObject();
            user.scopes = ["admin.*"];

            const createdUserResponse = await testUtils.createUser(user);
            const deleteResponse = await bus.request({
                subject: constants.endpoints.http.admin.DELETE_USER,
                skipOptionsRequest: true,
                timeout: 1000,
                message: {
                    reqId: uuid.v4(),
                    user: user,
                    params: { id: createdUserResponse.data.id }
                }
            });

            expect(deleteResponse.status).toBe(200, "deleteResponse.status");

            const userInDatabase = await db.collection(config.userCollection).findOne({ id: createdUserResponse.data.id });
            expect(userInDatabase).toBe(null, "userInDatabase");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should return 404 when trying to remove non-existent user", async done => {
        try {
            const user = mocks.getUserObject();

            try {
                await bus.request({
                    subject: constants.endpoints.service.DELETE_USER,
                    timeout: 1000,
                    skipOptionsRequest: true,
                    message: {
                        reqId: uuid.v4(),
                        data: { id: uuid.v4() }
                    }
                });

                done.fail();
            } catch (err) {
                expect(err.status).toBe(404, "deleteResponse.status");
                done();
            }
        } catch (err) {
            log.error(err);
            done.fail(err);
        }

    });

    it("should return 404 when trying to remove non-existent user via http", async done => {
        try {
            const user = mocks.getUserObject();
            user.scopes = ["admin.*"];

            try {
                await bus.request({
                    subject: constants.endpoints.http.admin.DELETE_USER,
                    timeout: 1000,
                    skipOptionsRequest: true,
                    message: {
                        user: user,
                        reqId: uuid.v4(),
                        params: { id: uuid.v4() }
                    }
                });

                done.fail();
            } catch (err) {
                expect(err.status).toBe(404, "deleteResponse.status");
                done();
            }
        } catch (err) {
            log.error(err);
            done.fail();
        }
    });

});