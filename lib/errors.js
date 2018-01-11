const frusterErrors = require("fruster-errors");

const errors = [
    { status: 500, code: "INTERNAL_SERVER_ERROR", title: "Internal server error", detail: (detail) => { return detail; } },

    { status: 400, code: "BAD_REQUEST", title: "Request has invalid or missing fields" },

    { status: 401, code: "UNAUTHORIZED", title: "Unauthorized" },

    { status: 404, code: "NOT_FOUND", title: "Resource does not exist" },

    { status: 400, code: "EMAIL_NOT_VERIFIED", title: "User's email is not verified" },

    { status: 400, code: "INVALID_TOKEN", title: "Token is invalid", detail: (token) => `${token} is not a valid token` },

    { status: 400, code: "SYSTEM_ROLE_ALREADY_EXISTS", title: "System role already exists", detail: (role) => `The system role ${role} already exists` }
];

module.exports = frusterErrors("fruster-user-service", errors);