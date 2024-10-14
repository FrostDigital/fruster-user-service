const Db = require("mongodb").Db;
const uuid = require("uuid");
const SpecUtils = require('./support/SpecUtils');
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
            .testUtilsOptions((connection) => {
                db = connection.db;
            }));

    afterEach(() => SpecUtils.resetConfig());

    it("should return 200 when user is successfully removed", async () => {
        const user = mocks.getUserObject();
        const createdUserResponse = await SpecUtils.createUser(user);
        const reqData = { id: createdUserResponse.data.id };
        const deleteResponse = await SpecUtils.busRequest(constants.endpoints.service.DELETE_USER, reqData);

        expect(deleteResponse.status).toBe(200, "deleteResponse.status");

        const userInDatabase = await db.collection(constants.collections.USERS).findOne(reqData);
        expect(userInDatabase).toBe(null, "userInDatabase");
    });

    it("should return 200 when user is successfully removed with split datasets", async () => {
        config.userFields = constants.dataset.REQUIRED_ONLY;

        const user = mocks.getUserObject();
        const createdUserResponse = await SpecUtils.createUser(user);
        const reqData = { id: createdUserResponse.data.id };
        const profileBeforeDelete = (await db.collection(constants.collections.PROFILES).findOne(reqData));

        expect(profileBeforeDelete.firstName).toBeDefined("profile.firstName");
        expect(profileBeforeDelete.lastName).toBeDefined("profile.lastName");
        expect(profileBeforeDelete.id).toBeDefined("profile.id");

        const deleteResponse = await SpecUtils.busRequest(constants.endpoints.service.DELETE_USER, reqData);

        expect(deleteResponse.status).toBe(200, "deleteResponse.status");

        const userInDatabase = await db.collection(constants.collections.USERS).findOne(reqData);
        expect(userInDatabase).toBe(null, "userInDatabase");

        const profileAfterDelete = (await db.collection(constants.collections.PROFILES).findOne(reqData));
        expect(profileAfterDelete).toBe(null, "userInDatabase");
    });

    it("should return 200 when user is successfully removed via http", async () => {
        const user = mocks.getUserObject();
        user.scopes = ["admin.*"];

        const createdUserResponse = await SpecUtils.createUser(user);
        const reqData = { id: createdUserResponse.data.id };
        const deleteResponse = await SpecUtils.busRequest(constants.endpoints.service.DELETE_USER, reqData);

        expect(deleteResponse.status).toBe(200, "deleteResponse.status");

        const userInDatabase = await db.collection(constants.collections.USERS).findOne(reqData);
        expect(userInDatabase).toBe(null, "userInDatabase");
    });

    it("should return 404 when trying to remove non-existent user", async () => {
        try {
            await SpecUtils.busRequest(constants.endpoints.service.DELETE_USER, { id: uuid.v4() });

			fail();
        } catch (err) {
            expect(err.status).toBe(404, "deleteResponse.status");
        }
    });

    it("should return 404 when trying to remove non-existent user via http", async () => {
        const user = mocks.getUserObject();
        user.scopes = ["admin.*"];

        try {
            await SpecUtils.busRequest({
                subject: constants.endpoints.http.admin.DELETE_USER,
                data: { id: uuid.v4() },
                user,
                params: { id: uuid.v4() }
            });


        } catch (err) {
            expect(err.status).toBe(404, "deleteResponse.status");
        }
    });

});
