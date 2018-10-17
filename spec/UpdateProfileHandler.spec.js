const config = require('../config');
const mocks = require('./support/mocks.js');
const SpecUtils = require('./support/SpecUtils');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const specConstants = require("./support/spec-constants");


describe("UpdateProfileHandler", () => {

    frusterTestUtils
        .startBeforeEach({
            beforeStart: () => config.userFields = ["isRelatedToSlatan"],
            ...specConstants.testUtilsOptions()
        });

    afterEach(() => SpecUtils.resetConfig());

    it("should filter out user fields and only update profile fields when updating profile when configured to split user data", async () => {
        const user = mocks.getUserObject();
        const createdUserResponse = await SpecUtils.createUser(user);
        const newFirstName = "Roland";
        const newLastName = "Svensson";

        const updateResponse = await SpecUtils.busRequest({
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
    });

    it("should return 200 if nothing was updated", async () => {
        const user = mocks.getUserObject();
        const createdUserResponse = await SpecUtils.createUser(user);

        const updateResponse = await SpecUtils.busRequest({
            subject: constants.endpoints.service.UPDATE_PROFILE,
            data: { id: createdUserResponse.data.id, isRelatedToSlatan: "true_dat" }
        });

        expect(updateResponse.data.firstName).toBe(user.firstName, "updateResponse.data.firstName");
        expect(updateResponse.data.lastName).toBe(user.lastName, "updateResponse.data.lastName");
        expect(updateResponse.data.isRelatedToSlatan).toBeUndefined("updateResponse.data.isRelatedToSlatan");
        expect(new Date(updateResponse.data.metadata.updated).getTime())
            .toBeGreaterThan(new Date(createdUserResponse.data.metadata.updated).getTime(), "updateResponse.data.metadata.updated")
    });

});