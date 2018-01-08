module.exports = {

    SERVICE_NAME: "fruster-user-service",

    endpoints: {

        http: {

            admin: {

                CREATE_USER: "http.post.admin.user",
                GET_USERS: "http.get.admin.user",
                GET_USER: "http.get.admin.user.:id",
                UPDATE_USER: "http.put.admin.user.:id",
                DELETE_USER: "http.delete.admin.user.:id"

            },

            VERIFY_EMAIL: "http.post.user.verify.:tokenId",
            RESEND_VERIFICATION_EMAIL: "http.post.user.resend-verification.:email"

        },

        service: {

            CREATE_USER: "user-service.create-user",
            GET_USER: "user-service.get-user",
            UPDATE_USER: "user-service.update-user",
            DELETE_USER: "user-service.delete-user",
            VALIDATE_PASSWORD: "user-service.validate-password",
            UPDATE_PASSWORD: "user-service.update-password",
            SET_PASSWORD: "user-service.set-password",
            ADD_ROLES: "user-service.add-roles",
            REMOVE_ROLES: "user-service.remove-roles",
            GET_SCOPES_FOR_ROLES: "user-service.get-scopes",
            VERIFY_EMAIL: "user-service.verify-email",
            RESEND_VERIFICATION_EMAIL: "user-service.resend-verification"

        }

    },

    schemas: {

        request: {

            CREATE_USER_REQUEST: "CreateUserRequest",
            VALIDATE_PASSWORD_REQUEST: "ValidatePasswordRequest",
            UPDATE_PASSWORD_REQUEST: "UpdatePasswordRequest",
            ADD_AND_REMOVE_ROLES_REQUEST: "AddRemoveRolesRequest",
            GET_SCOPES_FOR_ROLES: "GetScopesForRolesRequest",
            DELETE_USER_REQUEST: "DeleteUserRequest",
            SET_PASSWORD_REQUEST: "SetPasswordRequest",
            UPDATE_USER_REQUEST: "UpdateUserRequest",
            UPDATE_USER_HTTP_REQUEST: "UpdateUserHttpRequest"

        },

        response: {

            USER_RESPONSE: "UserResponse",
            USER_LIST_RESPONSE: "UserListResponse",
            VERIFY_EMAIL_ADDRESS_RESPONSE: "VerifyEmailAddressResponse"
        }

    },

    permissions: {

        ADMIN_ANY: "admin.*"

    },

    collections: {

        INITIAL_USER: "initial-user",

    }

};