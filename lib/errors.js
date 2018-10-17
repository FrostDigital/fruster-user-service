const frusterErrors = require("fruster-errors");

/** NOTE: all prefixed `fruster-user-service.` errors are from an old version of fruster errors and should not be renamed! */

const errors = [

    { status: 500, code: "fruster-user-service.INTERNAL_SERVER_ERROR", title: "Internal server error", detail: (detail) => { return detail; } },

    { status: 400, code: "fruster-user-service.BAD_REQUEST", title: "Request has invalid or missing fields", detail: (detail) => { return detail; } },

    { status: 401, code: "fruster-user-service.UNAUTHORIZED", title: "Unauthorized" },

    { status: 401, code: "fruster-user-service.PASSWORD_REQUIRED", title: "Password required", detail: "Password required to update email." },

    { status: 404, code: "fruster-user-service.NOT_FOUND", title: "Resource does not exist" },

    { status: 400, code: "fruster-user-service.EMAIL_NOT_VERIFIED", title: "User's email is not verified" },

    { status: 400, code: "fruster-user-service.*_NOT_UNIQUE", title: "* is not unique", detail: (field, fieldValue) => `Another account has already been registered with the provided ${field}: ${fieldValue}` },

    { status: 400, code: "fruster-user-service.INVALID_TOKEN", title: "Token is invalid", detail: (token) => `${token} is not a valid token` },

    { status: 400, code: "fruster-user-service.SYSTEM_ROLE_ALREADY_EXISTS", title: "System role already exists", detail: (role) => `The system role ${role} already exists` },

    { status: 400, code: "fruster-user-service.CANNOT_DELETE_SUPER_ADMIN", title: "Cannot delete super-admin role", detail: () => `Cannot delete super-admin role as it is needed to access the interface` }

];

module.exports = frusterErrors(errors);