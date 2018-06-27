const config = require("../config");


module.exports = {

    SERVICE_NAME: "fruster-user-service",

    endpoints: {

        http: {

            admin: {

                CREATE_USER: "http.post.admin.user",
                DELETE_USER: "http.delete.admin.user.:id",
                GET_USERS: "http.get.admin.user",
                GET_USER: "http.get.admin.user.:id",
                UPDATE_USER: "http.put.admin.user.:id",

                /** System role endpoints */
                ADD_SYSTEM_ROLE: "http.post.admin.system.role",
                GET_SYSTEM_ROLES: "http.get.admin.system.role",
                REMOVE_SYSTEM_ROLE: "http.delete.admin.system.role",
                ADD_SYSTEM_ROLE_SCOPES: "http.post.admin.system.role.scope",
                REMOVE_SYSTEM_ROLE_SCOPES: "http.delete.admin.system.role.scope"
            },

            RESEND_VERIFICATION_EMAIL: "http.post.user.resend-verification.:email",
            VERIFY_EMAIL: "http.post.user.verify.:tokenId",
            UPDATE_PASSWORD: "http.put.user.update-password"

        },

        service: {

            ADD_ROLES: "user-service.add-roles",
            CREATE_USER: "user-service.create-user",
            DELETE_USER: "user-service.delete-user",
            GET_SCOPES_FOR_ROLES: "user-service.get-scopes",
            GET_USER: "user-service.get-user", // DEPRECATED
            GET_USERS_BY_QUERY: "user-service.get-users-by-query",
            REMOVE_ROLES: "user-service.remove-roles",
            RESEND_VERIFICATION_EMAIL: "user-service.resend-verification",
            SET_PASSWORD: "user-service.set-password",
            UPDATE_PASSWORD: "user-service.update-password",
            UPDATE_USER: "user-service.update-user",
            VALIDATE_PASSWORD: "user-service.validate-password",
            VERIFY_EMAIL: "user-service.verify-email"
        }

    },

    schemas: {

        request: {

            ADD_AND_REMOVE_ROLES_REQUEST: "AddRemoveRolesRequest",
            get CREATE_USER_REQUEST() { return config.requireNames ? "CreateUserRequest" : "CreateUserWithoutNameRequest" },
            DELETE_USER_REQUEST: "DeleteUserRequest",
            GET_SCOPES_FOR_ROLES: "GetScopesForRolesRequest",
            GET_USERS_BY_QUERY: "GetUsersByQueryRequest",
            RESEND_VERIFICATION_EMAIL_REQUEST: "ResendVerificationEmailRequest",
            UPDATE_PASSWORD_REQUEST: "UpdatePasswordRequest",
            UPDATE_PASSWORD_HTTP_REQUEST: "UpdatePasswordHttpRequest",
            UPDATE_USER_HTTP_REQUEST: "UpdateUserHttpRequest",
            UPDATE_USER_REQUEST: "UpdateUserRequest",
            VALIDATE_PASSWORD_REQUEST: "ValidatePasswordRequest",
            VERIFY_EMAIL_ADDRESS_SERVICE_REQUEST: "VerifyEmailAddressServiceRequest",
            SET_PASSWORD_REQUEST: "SetPasswordRequest",

            ADD_SYSTEM_ROLE_REQUEST: "AddSystemRoleRequest",
            ADD_SYSTEM_ROLE_SCOPES_REQUEST: "AddSystemRoleScopesRequest",
            REMOVE_SYSTEM_ROLE_SCOPES_REQUEST: "RemoveSystemRoleScopesRequest"

        },

        response: {

            GET_USERS_BY_QUERY_RESPONSE: "GetUsersByQueryResponse",
            USER_RESPONSE: "UserResponse",
            USER_LIST_RESPONSE: "UserListResponse",
            VERIFY_EMAIL_ADDRESS_RESPONSE: "VerifyEmailAddressResponse",
            STRING_ARRAY_RESPONSE: "StringArrayResponse",

            ROLE_MODEL: "RoleModel",
            ROLE_MODEL_LIST_RESPONSE: "RoleModelListResponse"

        }

    },

    permissions: {

        ADD_SYSTEM_ROLE: "system.add-role",
        ADD_SYSTEM_ROLE_SCOPES: "system.add-role-scopes",
        GET_SYSTEM_ROLES: "system.get-roles",
        REMOVE_SYSTEM_ROLE: "system.remove-role",
        REMOVE_SYSTEM_ROLE_SCOPES: "system.remove-role-scopes",
        ADMIN_ANY: "admin.*"

    },

    collections: {

        // TODO: double check if this really is used or not
        // USERS: config.userCollection,
        USERS: "users",
        PROFILES: "profiles",
        INITIAL_USER: "initial-user",
        ROLE_SCOPES: "role-scopes"

    }

};