const log = require("fruster-log");
const Db = require("mongodb").Db;
const SpecUtils = require('./support/SpecUtils');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const mocks = require("./support/mocks");
const specConstants = require("./support/spec-constants");
const config = require("../config");
const Publishes = require("../lib/Publishes");
const bus = require("fruster-bus");

describe("DeleteUsersByQueryHandler", () => {

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
        const deleteResponse = await SpecUtils.busRequest(constants.endpoints.service.DELETE_USERS_BY_QUERY, reqData);

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

        const deleteResponse = await SpecUtils.busRequest(constants.endpoints.service.DELETE_USERS_BY_QUERY, reqData);

        expect(deleteResponse.status).toBe(200, "deleteResponse.status");

        const userInDatabase = await db.collection(constants.collections.USERS).findOne(reqData);
        expect(userInDatabase).toBe(null, "userInDatabase");

        const profileAfterDelete = (await db.collection(constants.collections.PROFILES).findOne(reqData));

        expect(profileAfterDelete).toBe(null, "userInDatabase");
    });

    it("should be possible to remove users based on profile fields with split datasets", async () => {
        config.userFields = constants.dataset.REQUIRED_ONLY;

        const user = mocks.getUserObject();
        const createdUserResponse = await SpecUtils.createUser(user);
        const reqData = { id: createdUserResponse.data.id };

        const profileBeforeDelete = (await db.collection(constants.collections.PROFILES).findOne(reqData));

        expect(profileBeforeDelete.firstName).toBeDefined("profile.firstName");
        expect(profileBeforeDelete.lastName).toBeDefined("profile.lastName");
        expect(profileBeforeDelete.id).toBeDefined("profile.id");

        const deleteResponse = await SpecUtils.busRequest(constants.endpoints.service.DELETE_USERS_BY_QUERY, {
            "profile.firstName": createdUserResponse.data.profile.firstName
        });

        expect(deleteResponse.status).toBe(200, "deleteResponse.status");

        const userInDatabase = await db.collection(constants.collections.USERS).findOne(reqData);
        expect(userInDatabase).toBe(null, "userInDatabase");

        const profileAfterDelete = (await db.collection(constants.collections.PROFILES).findOne(reqData));

        expect(profileAfterDelete).toBe(null, "userInDatabase");
    });

    it(`should publish ${Publishes.subjects.USER_DELETED} for each removed user`, async () => {
        try {
            config.userFields = constants.dataset.REQUIRED_ONLY;

            const user = { ...mocks.getUserObject() };
            const user2 = { ...mocks.getUserObject(), email: "joe@frost.se" };
            const createdUserResponse = await SpecUtils.createUser(user);
            const createdUserResponse2 = await SpecUtils.createUser(user2);
            const reqData = { id: { $in: [createdUserResponse.data.id, createdUserResponse2.data.id] } };

            let pubs = 0;
            const pubUserIds = [];

            bus.subscribe(Publishes.subjects.USER_DELETED, (req) => {
                pubs++;
                pubUserIds.push(req.data.userId);

                if (pubs === 2) {
                    expect(pubUserIds.length).toBe(2, "pubUserIds.length");
                    pubUserIds.forEach(userId => expect(reqData.id.$in.includes(userId)).toBeTruthy("reqData.id.$in.includes(userId)"));
                    // done();
                }
            });

            const profilesBeforeDelete = await db.collection(constants.collections.PROFILES).find(reqData).toArray();

            expect(profilesBeforeDelete[0].firstName).toBeDefined("profile.firstName");
            expect(profilesBeforeDelete[0].lastName).toBeDefined("profile.lastName");
            expect(profilesBeforeDelete[0].id).toBeDefined("profile.id");

            const deleteResponse = await SpecUtils.busRequest(constants.endpoints.service.DELETE_USERS_BY_QUERY, reqData);

            expect(deleteResponse.status).toBe(200, "deleteResponse.status");

            const userInDatabase = await db.collection(constants.collections.USERS).findOne(reqData);
            expect(userInDatabase).toBe(null, "userInDatabase");

            const profileAfterDelete = (await db.collection(constants.collections.PROFILES).findOne(reqData));

            expect(profileAfterDelete).toBe(null, "userInDatabase");
        } catch (err) {
            log.error(err.stack ? err.stack : err);
			expect(err).toBe(null);
        }
    });

    it("should not allow empty query", async () => {
        try {
            const user = mocks.getUserObject();
            const createdUserResponse = await SpecUtils.createUser(user);
            const reqData = { id: createdUserResponse.data.id };
            const deleteResponse = await SpecUtils.busRequest(constants.endpoints.service.DELETE_USERS_BY_QUERY, {});

            expect(deleteResponse.status).toBe(200, "deleteResponse.status");

            const userInDatabase = await db.collection(constants.collections.USERS).findOne(reqData);
            expect(userInDatabase).toBe(null, "userInDatabase");

			expect(true).toBe(false, "Should not reach this point");
        } catch (err) {
            expect(err.status).toBe(400);
        }
    });

});
