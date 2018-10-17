const frusterTestUtils = require("fruster-test-utils");
const constants = require("../lib/constants");
const specConstants = require("./support/spec-constants");
const TestUtils = require("./support/SpecUtils");
const config = require("../config");


describe("GetProfilesByQueryHandler", () => {

    frusterTestUtils
        .startBeforeEach({
            beforeStart: () => config.userFields = constants.dataset.REQUIRED_ONLY,
            ...specConstants.testUtilsOptions()
        });

    afterEach(() => TestUtils.resetConfig());

    it("should be able to get profiles by a simple query", async () => {
        const testUsers = await createTestUsers(10);

        const res = await TestUtils.busRequest({
            subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
            data: { query: { id: { $in: testUsers.map((u) => u.id).filter((u, i) => i % 2 !== 0) } } }
        });

        expect(res.data.profiles.length).toBe(5, "res.data.profiles.length");
        expect(res.data.totalCount).toBe(5, "res.data.totalCount");

        const selectedUsers = testUsers.filter((u, i) => i % 2 !== 0);

        for (let i = 0; i < 5; i++) {
            expect(res.data.profiles[i].id).toBe(selectedUsers[i].id, "res.data.profiles[i].id");
            expect(res.data.profiles[i].firstName).toBe(selectedUsers[i].profile.firstName, "res.data.profiles[i].firstName");
            expect(res.data.profiles[i].lastName).toBe(selectedUsers[i].profile.lastName, "res.data.profiles[i].lastName");
            expect(res.data.profiles[i].password).toBeUndefined("res.data.profiles[i].password");
            expect(res.data.profiles[i].salt).toBeUndefined("res.data.profiles[i].salt");
        }
    });

    it("should be able to paginate result from get profiles by query  with `limit`", async () => {
        const testUsers = await createTestUsers(10);

        const res = await TestUtils.busRequest({
            subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
            data: {
                query: { id: { $in: testUsers.map((u) => u.id) } },
                limit: 3
            }
        });

        expect(res.data.profiles.length).toBe(3, "res.data.length");
        expect(res.data.totalCount).toBe(10, "res.data.totalCount");

        for (let i = 0; i < 3; i++) {
            expect(res.data.profiles[i].id).toBe(testUsers[i].id, "res.data.profiles[i].id");
            expect(res.data.profiles[i].firstName).toBe(testUsers[i].profile.firstName, "res.data.profiles[i].firstName");
            expect(res.data.profiles[i].lastName).toBe(testUsers[i].profile.lastName, "res.data.profiles[i].lastName");
            expect(res.data.profiles[i].password).toBeUndefined("res.data.profiles[i].password");
            expect(res.data.profiles[i].salt).toBeUndefined("rres.data.profiles[i].salt");
        }
    });

    it("should be able to shift paginated result from get profiles by query with `start`", async () => {
        const testUsers = await createTestUsers(10);

        const res = await TestUtils.busRequest({
            subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
            data: {
                query: { id: { $in: testUsers.map((u) => u.id) } },
                limit: 3,
                start: 3
            }
        });

        expect(res.data.profiles.length).toBe(3, "res.data.length");
        expect(res.data.totalCount).toBe(10, "res.data.totalCount");

        for (let i = 0; i < 3; i++) {
            expect(res.data.profiles[i].id).toBe(testUsers[i + 3].id, "res.data.profiles[i].id");
            expect(res.data.profiles[i].firstName).toBe(testUsers[i + 3].profile.firstName, "res.data.profiles[i].firstName");
            expect(res.data.profiles[i].lastName).toBe(testUsers[i + 3].profile.lastName, "res.data.profiles[i].lastName");
            expect(res.data.profiles[i].password).toBeUndefined("res.data.profiles[i].password");
            expect(res.data.profiles[i].salt).toBeUndefined("rres.data.profiles[i].salt");
        }
    });

    it("should be able to filter result with `filter`", async () => {
        const testUsers = await createTestUsers(10);

        const res = await TestUtils.busRequest({
            subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
            data: {
                query: { id: { $in: testUsers.map((u) => u.id) } },
                limit: 3,
                start: 3,
                filter: {
                    firstName: 1,
                    lastName: 1
                }
            }
        });

        expect(res.data.profiles.length).toBe(3, "res.data.length");
        expect(res.data.totalCount).toBe(10, "res.data.totalCount");

        for (let i = 0; i < 3; i++) {
            expect(Object.keys(res.data.profiles[i]).length).toBe(2, "Object.keys(res.data.profiles[i]).length");
            expect(res.data.profiles[i].firstName).toBe(testUsers[i + 3].profile.firstName, "res.data.profiles[i].firstName");
            expect(res.data.profiles[i].lastName).toBe(testUsers[i + 3].profile.lastName, "res.data.profiles[i].lastName");
        }
    });

    it("should be able to sort result with `sort`", async () => {
        const testUsers = await createTestUsers(10);
        const res = await doRequest(1, testUsers.map(u => u.id));
        const res2 = await doRequest(-1, testUsers.map(u => u.id));

        expect(res.data.profiles.length).toBe(3, "res.data.length");
        expect(res.data.totalCount).toBe(10, "res.data.totalCount");

        expect(res2.data.profiles.length).toBe(3, "res2.data.length");
        expect(res2.data.totalCount).toBe(10, "res2.data.totalCount");

        for (let i = 0; i < 3; i++) {
            if (i > 0)
                expect(res.data.profiles[i].customField).toBeGreaterThan(res.data.profiles[i - 1].customField, "res.data.profiles[i].customField");
        }

        for (let i = 0; i < 3; i++) {
            if (i > 0)
                expect(res2.data.profiles[i].customField).toBeLessThan(res2.data.profiles[i - 1].customField, "res2.data.profiles[i].customField");
        }

        /**
         * @param {Number} sort 
         * @param {Array<String>} ids 
         */
        async function doRequest(sort, ids) {
            return await TestUtils.busRequest({
                subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
                data: {
                    query: { id: { $in: ids } },
                    limit: 3,
                    start: 3,
                    filter: {
                        firstName: 1,
                        lastName: 1,
                        customField: 1
                    },
                    sort: { customField: sort }
                }
            });
        }
    });

    it("should return empty array if no profiles can be found", async () => {
        await createTestUsers(10);

        const res = await TestUtils.busRequest({
            subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
            data: {
                query: { roles: { $in: ["no-one-can-have-this-role"] } },
                limit: 3,
                start: 3,
                filter: {
                    firstName: 1,
                    lastName: 1
                }
            }
        });

        expect(res.data.profiles.length).toBe(0, "res.data.profiles.length");
        expect(res.data.totalCount).toBe(0, "res.data.totalCount");
    });

    /**
     * @param {Number} number 
     * @param {Number=} startAt 
     */
    async function createTestUsers(number = 2, startAt = 0) {
        const users = [];

        for (let i = startAt; i < startAt + number; i++) {
            const u = await TestUtils.createUser(getTestUserData(`user${i}`, i));
            users.push(u.data);
        }

        return users;

        function getTestUserData(username, i) {
            return {
                firstName: `${username}-firstName`,
                lastName: `${username}-lastName`,
                email: `${username}@example.com`,
                roles: ["user"],
                password: username + "ABc123",
                customField: Math.cos(i)
            };
        }
    }

});