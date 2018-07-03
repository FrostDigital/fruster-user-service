const log = require("fruster-log");
const uuid = require("uuid");
const config = require('../config');
const mocks = require('./support/mocks.js');
const TestUtils = require('./support/TestUtils');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");


describe("UpdateProfileHandler", () => {

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions());

    afterEach(() => TestUtils.resetConfig());

    it("should filter out user fields and only update profile fields when updating profile when configured to split user data", async done => {
        config.userFields = ["isRelatedToSlatan"];

        try {
            const user = mocks.getUserObject();
            const createdUserResponse = await TestUtils.createUser(user);
            const newFirstName = "Roland";
            const newLastName = "Svensson";

            const updateResponse = await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_PROFILE,
                data: {
                    id: createdUserResponse.data.id, firstName: newFirstName, lastName: newLastName,
                    isRelatedToSlatan: false /** User field */
                }
            });

            expect(updateResponse.data.firstName).toBe(newFirstName, "updateResponse.data.firstName");
            expect(updateResponse.data.lastName).toBe(newLastName, "updateResponse.data.lastName");
            expect(updateResponse.data.isRelatedToSlatan).toBeUndefined("updateResponse.data.isRelatedToSlatan");
            expect(new Date(updateResponse.data.metadata.updated).getTime())
                .toBeGreaterThan(new Date(createdUserResponse.data.metadata.updated).getTime(), "updateResponse.data.metadata.updated")

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should return 200 if nothing was updated", async done => {
        config.userFields = ["isRelatedToSlatan"];

        try {
            const user = mocks.getUserObject();
            const createdUserResponse = await TestUtils.createUser(user);

            const updateResponse = await TestUtils.busRequest({
                subject: constants.endpoints.service.UPDATE_PROFILE,
                data: { id: createdUserResponse.data.id, isRelatedToSlatan: "true_dat" }
            });

            expect(updateResponse.data.firstName).toBe(user.firstName, "updateResponse.data.firstName");
            expect(updateResponse.data.lastName).toBe(user.lastName, "updateResponse.data.lastName");
            expect(updateResponse.data.isRelatedToSlatan).toBeUndefined("updateResponse.data.isRelatedToSlatan");
            expect(new Date(updateResponse.data.metadata.updated).getTime())
                .toBeGreaterThan(new Date(createdUserResponse.data.metadata.updated).getTime(), "updateResponse.data.metadata.updated")

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});