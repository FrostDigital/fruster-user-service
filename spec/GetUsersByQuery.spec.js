const frusterTestUtils = require("fruster-test-utils");
const log = require("fruster-log");
const constants = require("../lib/constants");
const Db = require("mongodb").Db;
const specConstants = require("./support/spec-constants");
const TestUtils = require("./support/TestUtils");
const config = require("../config");


describe("GetUsersByQueryHandler", () => {

    /** @type {Db} */
    let db;

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions(connection => db = connection.db));

    afterEach(() => { TestUtils.resetConfig(); });

    it("should be able to get users by a simple query", async done => {
        await insertTestUsers(10);

        try {
            const res = await TestUtils.busRequest({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                data: { query: { roles: { $in: ["user"] } } }
            });

            expect(res.data.users.length).toBe(10, "res.data.users.length");
            expect(res.data.totalCount).toBe(10, "res.data.totalCount");

            for (let i = 0; i < 10; i++) {
                expect(res.data.users[i].id).toBe(`user${i}`, "res.data.users[i].id");
                expect(res.data.users[i].password).toBeUndefined("res.data.users[i].password");
                expect(res.data.users[i].salt).toBeUndefined("res.data.users[i].salt");
            }

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should be able to get users by a query with expanded profile", async done => {
        config.userFields = [constants.dataset.REQUIRED_ONLY];
        await createTestUsers(10);

        try {
            const res = await TestUtils.busRequest({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                data: { query: { roles: { $in: ["user"] } }, expand: "profile", sort: { firstName: 1 } }
            });

            expect(res.data.users.length).toBe(10, "res.data.users.length");
            expect(res.data.totalCount).toBe(10, "res.data.totalCount");

            for (let i = 0; i < 10; i++) {
                expect(res.data.users[i].id).toBeDefined("res.data.users[i].id");
                expect(res.data.users[i].password).toBeUndefined("res.data.users[i].password");
                expect(res.data.users[i].salt).toBeUndefined("res.data.users[i].salt");
                expect(res.data.users[i].profile).toBeDefined("res.data.users[i].profile");
                expect(res.data.users[i].profile.firstName).toBe(`user${i}-firstName`, "res.data.users[i].profile.firstName");
                expect(res.data.users[i].profile.lastName).toBe(`user${i}-lastName`, "res.data.users[i].profile.lastName");
                expect(res.data.users[i].profile.customField).toBe(Math.cos(i), "res.data.users[i].profile.customField");

                expect(res.data.users[i].metadata).toBeDefined("res.data.users[i].profile.metadata");
                expect(res.data.users[i].metadata.created).toBeDefined("res.data.users[i].profile.metadata.created");
                expect(res.data.users[i].metadata.updated).toBeDefined("res.data.users[i].profile.metadata.updated");
                expect(res.data.users[i].profile.metadata).toBeDefined("res.data.users[i].profile.metadata");
                expect(res.data.users[i].profile.metadata.created).toBeDefined("res.data.users[i].profile.metadata.created");
                expect(res.data.users[i].profile.metadata.updated).toBeDefined("res.data.users[i].profile.metadata.updated");
            }

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should be able to get users by a query with expanded profile w/ old user data", async done => {
        await insertTestUsers(5);
        config.userFields = [constants.dataset.REQUIRED_ONLY];
        await createTestUsers(5, 5);

        try {
            const res = await TestUtils.busRequest({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                data: { query: { roles: { $in: ["user"] } }, expand: "profile", sort: { firstName: 1 } }
            });

            expect(res.data.users.length).toBe(10, "res.data.users.length");
            expect(res.data.totalCount).toBe(10, "res.data.totalCount");

            expect(res.data.users.filter(u => !!u.profile).length).toBe(5);
            expect(res.data.users.filter(u => !u.profile).length).toBe(5);

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should be able to paginate result from get users by query  with `limit`", async done => {
        await insertTestUsers(10);

        try {
            const res = await TestUtils.busRequest({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                data: { query: { roles: { $in: ["user"] } }, limit: 3 }
            });

            expect(res.data.users.length).toBe(3, "res.data.length");
            expect(res.data.totalCount).toBe(10, "res.data.totalCount");

            for (let i = 0; i < 3; i++) {
                expect(res.data.users[i].id).toBe(`user${i}`, "res.data.users[i].id");
                expect(res.data.users[i].password).toBeUndefined("res.data.users[i].password");
                expect(res.data.users[i].salt).toBeUndefined("res.data.users[i].salt");
            }

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should be able to shift paginated result from get users by query with `start`", async done => {
        await insertTestUsers(10);

        try {
            const res = await TestUtils.busRequest({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                data: { query: { roles: { $in: ["user"] } }, limit: 3, start: 3 }
            });

            expect(res.data.users.length).toBe(3, "res.data.length");
            expect(res.data.totalCount).toBe(10, "res.data.totalCount");

            for (let i = 0; i < 3; i++) {
                expect(res.data.users[i].id).toBe(`user${i + 3}`, "res.data.users[i].id");
                expect(res.data.users[i].password).toBeUndefined("res.data.users[i].password");
                expect(res.data.users[i].salt).toBeUndefined("res.data.users[i].salt");
            }

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should be able to filter result with `filter`", async done => {
        await insertTestUsers(10);

        try {
            const res = await TestUtils.busRequest({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                data: { query: { roles: { $in: ["user"] } }, limit: 3, start: 3, filter: { firstName: 1, lastName: 1 } }
            });

            expect(res.data.users.length).toBe(3, "res.data.length");
            expect(res.data.totalCount).toBe(10, "res.data.totalCount");

            for (let i = 0; i < 3; i++) {
                expect(Object.keys(res.data.users[i]).length).toBe(2, "Object.keys(res.data.users[i]).length");
                expect(res.data.users[i].firstName).toBe(`user${i + 3}-firstName`, "res.data.users[i].firstName");
                expect(res.data.users[i].lastName).toBe(`user${i + 3}-lastName`, "res.data.users[i].lastName");
            }

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    it("should be able to sort result with `sort`", async done => {
        await insertTestUsers(10);

        try {
            const res = await doRequest(1);
            const res2 = await doRequest(-1);

            expect(res.data.users.length).toBe(3, "res.data.length");
            expect(res.data.totalCount).toBe(10, "res.data.totalCount");

            expect(res2.data.users.length).toBe(3, "res2.data.length");
            expect(res2.data.totalCount).toBe(10, "res2.data.totalCount");

            for (let i = 0; i < 3; i++) {
                if (i > 0)
                    expect(res.data.users[i].customField).toBeGreaterThan(res.data.users[i - 1].customField, "res.data.users[i].customField");
            }

            for (let i = 0; i < 3; i++) {
                if (i > 0)
                    expect(res2.data.users[i].customField).toBeLessThan(res2.data.users[i - 1].customField, "res2.data.users[i].customField");
            }

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }

        async function doRequest(sort) {
            return await await TestUtils.busRequest({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                data: {
                    query: { roles: { $in: ["user"] } },
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

    it("should return empty array if no users can be found", async done => {
        await insertTestUsers(10);

        try {
            const res = await TestUtils.busRequest({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                data: { query: { roles: { $in: ["no-one-can-have-this-role"] } }, limit: 3, start: 3, filter: { firstName: 1, lastName: 1 } }
            });

            expect(res.data.users.length).toBe(0, "res.data.length");
            expect(res.data.totalCount).toBe(0, "res.data.totalCount");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

    /**
     * @param {Number} number 
     * @param {Number=} startAt 
     */
    async function createTestUsers(number = 2, startAt = 0) {
        for (let i = startAt; i < startAt + number; i++) {
            await TestUtils.createUser(getTestUserData(`user${i}`, i));
        }

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

    /**
     * @param {Number} number 
     * @param {Number=} startAt 
     */
    async function insertTestUsers(number = 2, startAt = 0) {
        const users = [];

        for (let i = startAt; i < startAt + number; i++) {
            users.push(`user${i}`);
        }

        return db.collection(constants.collections.USERS)
            .insert(users.map((username, i) => {
                return {
                    id: username,
                    firstName: `${username}-firstName`,
                    lastName: `${username}-lastName`,
                    email: `${username}@example.com`,
                    salt: `${username}-salt`,
                    roles: ["user"],
                    password: username,
                    customField: Math.cos(i)
                }
            }));
    }

});
