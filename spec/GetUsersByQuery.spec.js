const frusterTestUtils = require("fruster-test-utils");
const bus = require("fruster-bus");
const log = require("fruster-log");
const constants = require("../lib/constants");
const Db = require("mongodb").Db;
const specConstants = require("./support/spec-constants");


describe("GetUsersByQueryHandler", () => {

    frusterTestUtils
        .startBeforeEach(specConstants
            .testUtilsOptions((connection) => { return insertTestUsers(connection.db, 10); }));

    it("should be able to get users by a simple query", async done => {
        try {
            const res = await bus.request({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    data: { query: { roles: { $in: ["user"] } } }
                }
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

    it("should be able to paginate result from get users by query  with `limit`", async done => {
        try {
            const res = await bus.request({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    data: {
                        query: { roles: { $in: ["user"] } },
                        limit: 3
                    }
                }
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
        try {
            const res = await bus.request({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    data: {
                        query: { roles: { $in: ["user"] } },
                        limit: 3,
                        start: 3
                    }
                }
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
        try {
            const res = await bus.request({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    data: {
                        query: { roles: { $in: ["user"] } },
                        limit: 3,
                        start: 3,
                        filter: {
                            firstName: 1,
                            lastName: 1
                        }
                    }
                }
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
            return await bus.request({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
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
                }
            });
        }
    });

    it("should return empty array if no users can be found", async done => {
        try {
            const res = await bus.request({
                subject: constants.endpoints.service.GET_USERS_BY_QUERY,
                skipOptionsRequest: true,
                message: {
                    reqId: "reqId",
                    data: {
                        query: { roles: { $in: ["no-one-can-have-this-role"] } },
                        limit: 3,
                        start: 3,
                        filter: {
                            firstName: 1,
                            lastName: 1
                        }
                    }
                }
            });

            expect(res.data.users.length).toBe(0, "res.data.length");
            expect(res.data.totalCount).toBe(0, "res.data.totalCount");

            done();
        } catch (err) {
            log.error(err);
            done.fail(err);
        }
    });

});

/**
 * @param {Db} db 
 */
function insertTestUsers(db, number = 2) {
    const users = [];

    for (let i = 0; i < number; i++) {
        users.push(`user${i}`);
    }

    return db.collection("users")
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