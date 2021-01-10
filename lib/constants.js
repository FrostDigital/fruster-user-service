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
			UPDATE_PASSWORD: "http.put.user.update-password",
			GET_ME: "http.get.me"

		},

		service: {

			ADD_ROLES: "user-service.add-roles",
			CREATE_USER: "user-service.create-user",
			DELETE_USER: "user-service.delete-user",
			DELETE_USERS_BY_QUERY: "user-service.delete-users-by-query",
			GET_SCOPES_FOR_ROLES: "user-service.get-scopes",
			GET_USER: "user-service.get-user", // DEPRECATED
			GET_USERS_BY_QUERY: "user-service.get-users-by-query",
			GET_USERS_BY_AGGREGATE: "user-service.get-users-by-aggregate",
			GET_BY_AGGREGATE: "user-service.get-by-aggregate",
			REMOVE_ROLES: "user-service.remove-roles",
			RESEND_VERIFICATION_EMAIL: "user-service.resend-verification",
			SET_PASSWORD: "user-service.set-password",
			UPDATE_PASSWORD: "user-service.update-password",
			UPDATE_USER: "user-service.update-user",
			VALIDATE_PASSWORD: "user-service.validate-password",
			VERIFY_EMAIL: "user-service.verify-email",

			GET_PROFILES_BY_QUERY: "user-service.get-profiles-by-query",
			UPDATE_PROFILE: "user-service.update-profile"
		}

	},

	schemas: {

		request: {

			ADD_AND_REMOVE_ROLES_REQUEST: "AddRemoveRolesRequest",
			get CREATE_USER_REQUEST() { return config.requireNames ? "CreateUserRequest" : "CreateUserWithoutNameRequest" },
			DELETE_USER_REQUEST: "DeleteUserRequest",
			DELETE_USERS_BY_QUERY: "DeleteUsersByQueryRequest",
			GET_SCOPES_FOR_ROLES: "GetScopesForRolesRequest",
			GET_USERS_BY_QUERY: "GetUsersByQueryRequest",
			GET_USERS_BY_AGGREGATE: "GetUsersByAggregateRequest",
			GET_PROFILES_BY_QUERY: "GetProfilesByQueryRequest",
			RESEND_VERIFICATION_EMAIL_REQUEST: "ResendVerificationEmailRequest",
			UPDATE_PASSWORD_REQUEST: "UpdatePasswordRequest",
			UPDATE_PASSWORD_HTTP_REQUEST: "UpdatePasswordHttpRequest",
			UPDATE_USER_HTTP_REQUEST: "UpdateUserHttpRequest",
			UPDATE_USER_REQUEST: "UpdateUserRequest",
			UPDATE_PROFILE_REQUEST: "UpdateProfileRequest",
			VALIDATE_PASSWORD_REQUEST: "ValidatePasswordRequest",
			VERIFY_EMAIL_ADDRESS_SERVICE_REQUEST: "VerifyEmailAddressServiceRequest",
			SET_PASSWORD_REQUEST: "SetPasswordRequest",

			ADD_SYSTEM_ROLE_REQUEST: "AddSystemRoleRequest",
			ADD_SYSTEM_ROLE_SCOPES_REQUEST: "AddSystemRoleScopesRequest",
			REMOVE_SYSTEM_ROLE_SCOPES_REQUEST: "RemoveSystemRoleScopesRequest"

		},

		response: {

			GET_USERS_BY_QUERY_RESPONSE: "GetUsersByQueryResponse",
			GET_USERS_BY_AGGREGATE: "GetUsersByAggregateResponse",
			GET_BY_AGGREGATE: "GetByAggregateResponse",
			GET_PROFILES_BY_QUERY: "GetProfilesByQueryResponse",
			USER_RESPONSE: "UserResponse",
			USER_LIST_RESPONSE: "UserListResponse",
			VERIFY_EMAIL_ADDRESS_RESPONSE: "VerifyEmailAddressResponse",
			STRING_ARRAY_RESPONSE: "StringArrayResponse",
			GET_ME_RESPONSE: "User",

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

		USERS: "users",
		PROFILES: "profiles",
		INITIAL_USER: "initial-user",
		ROLE_SCOPES: "role-scopes"

	},

	/** User / profile dataset constants */
	dataset: {

		REQUIRED_ONLY: "REQUIRED_ONLY",
		ALL_FIELDS: "ALL",
		USER: "USER",
		PROFILE: "PROFILE",
		USER_REQUIRED_FIELDS: ["id", "email", "password", "salt", "hashDate", "roles", "emailVerified", "emailVerificationToken"],
	},

	MONGO_DB_DUPLICATE_KEY_ERROR_CODE: 11000

};
