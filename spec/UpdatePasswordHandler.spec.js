const mongo = require("mongodb");
const Db = mongo.Db;
const mocks = require('./support/mocks.js');
const SpecUtils = require('./support/SpecUtils');
const constants = require('../lib/constants.js');
const frusterTestUtils = require("fruster-test-utils");
const deprecatedErrors = require("../lib/deprecatedErrors");
const specConstants = require("./support/spec-constants");


describe("UpdatePasswordHandler", () => {

    /** @type {Db} */
    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => db = connection.db));

    it("should be possible to update password", async () => {
        const user = mocks.getUserObject();
        const createdUser = await SpecUtils.createUser(user);
        const updatePassword = {
            newPassword: "Localhost:8081",
            oldPassword: user.password,
            id: createdUser.data.id
        };
        const startUser = await db.collection("users")
            .findOne({ id: createdUser.data.id });

        await SpecUtils.busRequest({
            subject: constants.endpoints.service.UPDATE_PASSWORD,
            user: createdUser.data,
            data: updatePassword
        });

        const updatedUser = await db.collection("users")
            .findOne({ id: createdUser.data.id });

        expect(updatedUser.password).not.toBe(startUser.password, "updatedUser.password");
        expect(updatedUser.salt).not.toBe(startUser.salt, "updatedUser.salt");
        expect(updatedUser.hashDate).not.toBe(startUser.hashDate, "updatedUser.hashDate");
    });

    it("should be possible to update password via http", async () => {
        const user = mocks.getUserObject();
        const createdUser = await SpecUtils.createUser(user);
        const updatePassword = {
            newPassword: "Localhost:8081",
            oldPassword: user.password
        };
        const startUser = await db.collection("users")
            .findOne({ id: createdUser.data.id });

        await SpecUtils.busRequest({
            subject: constants.endpoints.http.UPDATE_PASSWORD,
            user: createdUser.data,
            data: updatePassword
        });

        const updatedUser = await db.collection("users")
            .findOne({ id: createdUser.data.id });

        expect(updatedUser.password).not.toBe(startUser.password, "updatedUser.password");
        expect(updatedUser.salt).not.toBe(startUser.salt, "updatedUser.salt");
        expect(updatedUser.hashDate).not.toBe(startUser.hashDate, "updatedUser.hashDate");
    });

    it("should not be possible to update someone else's password", async () => {
        const user = mocks.getUserObject();
        const response = await SpecUtils.createUser(user);
        const updatePassword = {
            newPassword: "Localhost:8081",
            oldPassword: user.password,
            id: "someone else's id"
        };

        const err = await SpecUtils.busRequestExpectError({
			subject: constants.endpoints.service.UPDATE_PASSWORD,
			user: response.data,
			data: updatePassword
		});

		expect(err.error.code).toBe(deprecatedErrors.errorCodes.forbidden, "err.error.code");
    });

    it("should not be possible to update password without validating the old password", async () => {
        const user = mocks.getUserObject();
        const response = await SpecUtils.createUser(user);
        const updatePassword = {
            newPassword: "Localhost:8081",
            oldPassword: "nothing",
            id: response.data.id
        };

        const err = await SpecUtils.busRequestExpectError({
			subject: constants.endpoints.service.UPDATE_PASSWORD,
			user: response.data,
			data: updatePassword
		});

		expect(err.error.code).toBe(deprecatedErrors.errorCodes.invalidUsernameOrPassword, "err.error.code");
    });

});
