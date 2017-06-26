const frusterErrors = require("fruster-errors");

const errors = [
    { status: 500, code: "INTERNAL_SERVER_ERROR", title: "Internal server error", detail: (detail) => { return detail; } },

    { status: 400, code: "BAD_REQUEST", title: "Request has invalid or missing fields" },

    { status: 401, code: "UNAUTHORIZED", title: "Unauthorized" },

    { status: 404, code: "NOT_FOUND", title: "Resource does not exist" },

    { status: 400, code: "EMAIL_NOT_VALIDATED", title: "User's email is not validated" },

    { status: 400, code: "INVALID_TOKEN", title: "Token is invalid", detail: (token) => `${token} is not a valid token` }
];

module.exports = frusterErrors("fruster-user-service", errors);