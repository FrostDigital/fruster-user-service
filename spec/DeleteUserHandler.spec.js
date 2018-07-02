const log = require("fruster-log");
const Db = require("mongodb").Db;
const uuid = require("uuid");
const TestUtils = require('./support/TestUtils');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const mocks = require("./support/mocks");
const specConstants = require("./support/spec-constants");
const config = require("../config");


describe("DeleteUserHandler", () => {

    /** @type {Db} */
    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => { db = connection.db; }));

    afterEach(() => TestUtils.resetConfig());

    it("should return 200 when user is successfully removed", async done => {
        try {
            const user = mocks.getUserObject();
            const createdUserResponse = await TestUtils.createUser(user);
            const reqData = { id: createdUserResponse.data.id };
            const deleteResponse = await TestUtils.busRequest(constants.endpoints.service.DELETE_USER, reqData);

            expect(deleteResponse.status).toBe(200, "deleteResponse.status");

            const userInDatabase = await db.collection(constants.collections.USERS).findOne(reqData);
            expect(userInDatabase).toBe(null, "userInDatabase");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should return 200 when user is successfully removed with split datasets", async done => {
        try {
            config.userFields = constants.dataset.REQUIRED_ONLY;

            const user = mocks.getUserObject();
            const createdUserResponse = await TestUtils.createUser(user);
            const reqData = { id: createdUserResponse.data.id };

            const profileBeforeDelete = (await db.collection(constants.collections.PROFILES).findOne({ id: createdUserResponse.data.id }));

            expect(profileBeforeDelete.firstName).toBeDefined("profile.firstName");
            expect(profileBeforeDelete.lastName).toBeDefined("profile.lastName");
            expect(profileBeforeDelete.id).toBeDefined("profile.id");

            const deleteResponse = await TestUtils.busRequest(constants.endpoints.service.DELETE_USER, reqData);

            expect(deleteResponse.status).toBe(200, "deleteResponse.status");

            const userInDatabase = await db.collection(constants.collections.USERS).findOne(reqData);
            expect(userInDatabase).toBe(null, "userInDatabase");

            const profileAfterDelete = (await db.collection(constants.collections.PROFILES).findOne({ id: createdUserResponse.data.id }));
            expect(profileAfterDelete).toBe(null, "userInDatabase");

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

            const createdUserResponse = await TestUtils.createUser(user);
            const reqData = { id: createdUserResponse.data.id };
            const deleteResponse = await TestUtils.busRequest(constants.endpoints.service.DELETE_USER, reqData);

            expect(deleteResponse.status).toBe(200, "deleteResponse.status");

            const userInDatabase = await db.collection(constants.collections.USERS).findOne(reqData);
            expect(userInDatabase).toBe(null, "userInDatabase");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should return 404 when trying to remove non-existent user", async done => {
        try {
            try {
                await TestUtils.busRequest(constants.endpoints.service.DELETE_USER, { id: uuid.v4() });

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
                await TestUtils.busRequest({ subject: constants.endpoints.http.admin.DELETE_USER, data: { id: uuid.v4() }, user, params: { id: uuid.v4() } });

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