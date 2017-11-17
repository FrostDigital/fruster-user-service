module.exports = {

    endpoints: {

        http: {

            admin: {

                CREATE_USER: "http.post.admin.user",
                GET_USERS: "http.get.admin.user",
                GET_USER: "http.get.admin.user.:id",
                UPDATE_USER: "http.put.admin.user.:id",
                DELETE_USER: "http.delete.admin.user.:id"

            },

            VERIFY_EMAIL: "http.post.validate.:token",
            RESEND_VERIFICATION_EMAIL: "http.post.resend-verification.:email"

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
            GET_SCOPES: "user-service.get-scopes",
            VERIFY_EMAIL: "user-service.verify-email",
            RESEND_VERIFICATION_EMAIL: "user-service.resend-verification"

        }

    }

};