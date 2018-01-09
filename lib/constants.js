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

            },

            RESEND_VERIFICATION_EMAIL: "http.post.user.resend-verification.:email",
            VERIFY_EMAIL: "http.post.user.verify.:tokenId",

        },

        service: {

            ADD_ROLES: "user-service.add-roles",
            CREATE_USER: "user-service.create-user",
            DELETE_USER: "user-service.delete-user",
            GET_SCOPES_FOR_ROLES: "user-service.get-scopes",
            GET_USER: "user-service.get-user",
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
            CREATE_USER_REQUEST: "CreateUserRequest",
            DELETE_USER_REQUEST: "DeleteUserRequest",
            GET_SCOPES_FOR_ROLES: "GetScopesForRolesRequest",
            RESEND_VERIFICATION_EMAIL_REQUEST: "ResendVerificationEmailRequest",
            UPDATE_PASSWORD_REQUEST: "UpdatePasswordRequest",
            UPDATE_USER_HTTP_REQUEST: "UpdateUserHttpRequest",
            UPDATE_USER_REQUEST: "UpdateUserRequest",
            VALIDATE_PASSWORD_REQUEST: "ValidatePasswordRequest",
            VERIFY_EMAIL_ADDRESS_SERVICE_REQUEST: "VerifyEmailAddressServiceRequest",
            SET_PASSWORD_REQUEST: "SetPasswordRequest"

        },

        response: {

            USER_RESPONSE: "UserResponse",
            USER_LIST_RESPONSE: "UserListResponse",
            VERIFY_EMAIL_ADDRESS_RESPONSE: "VerifyEmailAddressResponse",
            STRING_ARRAY_RESPONSE: "StringArrayResponse"

        }

    },

    permissions: {

        ADMIN_ANY: "admin.*"

    },

    collections: {

        INITIAL_USER: "initial-user",

    }

};