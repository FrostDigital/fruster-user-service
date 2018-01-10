const shared = {

    CREATE_USER: {
        description: "Creates a fruster user. Must include a few base fields but can contain any number of custom fields. Response has status code 201 if successful.",
        errors: {
            "user-service.400.7": "Password is required. If configured to require password.",
            "user-service.400.3": "Invalid password. Password does not follow the configured validation.",
            "user-service.400.4": "Invalid roles. One or more inputted roles are invalid",
            "user-service.400.5": "Invalid email. Email does not follow configured validation.",
            "user-service.400.10": "Email is not unique. Another account has already been registered with the provided email-address.",
            "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
        }
    },

    UPDATE_USER: {
        description: "Updates a user. Can contain any number of custom fields. Response has status code 200 if successful.",
        errors: {
            "user-service.404.1": "User not found.",
            "user-service.400.6": "Cannot update password. Cannot update password through user update",
            "user-service.400.10": "Email is not unique. Another account has already been registered with the provided email-address.",
            "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
        }
    },

    DELETE_USER: {
        description: "Deletes a user. Response has status code 200 if successful.",
        errors: {
            "user-service.NOT_FOUND": "User not found",
            "user-service.400.12": "Invalid id. Provided id does not follow the configured id validation.",
            "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
        }
    }

};

module.exports = {

    service: {

        CREATE_USER: {
            description: shared.CREATE_USER.description,
            errors: shared.CREATE_USER.errors
        },

        /** DEPRECATED */
        GET_USER: {
            description: "Gets users by query. Note: Deprecated, use user-service.get-users-by-query instead. Response has status code 200 if successful.",
            errors: {
                "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened.",
                "user-service.400.13": "Invalid json. Query includes salt or password or query is empty (and config.allowGetAll is false)"
            }
        },

        GET_USERS_BY_QUERY: {
            description: "Gets users by query.",
            errors: {
                "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened.",
                "user-service.400.13": "Invalid json. Query includes salt or password or query is empty (and config.allowGetAll is false)"
            }
        },

        UPDATE_USER: {
            description: shared.UPDATE_USER.description,
            errors: shared.UPDATE_USER.errors
        },

        VALIDATE_PASSWORD: {
            description: "Validates that inputted password becomes the same hash as for an account. Typically used by auth service for login. Response has status code 200 if successful.",
            errors: {
                "user-service.EMAIL_NOT_VERIFIED": "Email has not yet been verified.",
                "user-service.401.3": "Invalid username or password.",
                "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
            }
        },

        UPDATE_PASSWORD: {
            description: "Updates password of an account. Requires to validation of old password before new can be set. Response has status code 202 if successful.",
            errors: {
                "user-service.400.3": "Invalid password. Password does not follow the configured validation.",
                "user-service.401.3": "Invalid username or password.",
                "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
            }
        },

        DELETE_USER: {
            description: shared.DELETE_USER.description,
            errors: shared.DELETE_USER.errors
        },

        ADD_ROLES: {
            description: "Adds inputted roles to specified user. Can only add roles existing in configuration. Response has status code 202 if successful.",
            errors: {
                "user-service.404.1": "User not found.",
                "user-service.400.4": "Invalid roles. One or more inputted roles are invalid.",
                "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
            }
        },

        REMOVE_ROLES: {
            description: "Removes inputted roles from specified user. Cannot remove the last role. Response has status code 202 if successful.",
            errors: {
                "user-service.404.1": "User not found.",
                "user-service.400.4": "Invalid roles. One or more inputted roles are invalid.",
                "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
            }
        },

        GET_SCOPES_FOR_ROLES: {
            description: "Gets all scopes for specified roles in a flat array. E.g. input ['admin', 'user', 'super-admin'] would return  ['*', 'admin.*', 'profile.get']. Response has status code 200 if successful.",
            errors: {
                "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
            }
        },

        SET_PASSWORD: {
            description: "Sets password of a user. Used by password reset service. Note: Updating a user's password should be done w/ the update-password endpoint. Response has status code 202 if successful.",
            errors: {
                "user-service.400.3": "Invalid password. Password does not follow the configured validation.",
                "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
            }
        },

        VERIFY_EMAIL: {
            description: "Verifies a user's email address by providing a token sent to the user by email. Response has status code 200 if successful.",
            errors: {
                "INVALID_TOKEN": "Provided token is invalid. Either it's a faulty token or it has already been used.",
                "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
            }
        },

        RESEND_VERIFICATION_EMAIL: {
            description: "Generates a new email verification token and resends email w/ token to the provided user. Response has status code 200 if successful.",
            errors: {
                "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
            }
        }

    },

    http: {

        admin: {

            CREATE_USER: {
                description: shared.CREATE_USER.description,
                errors: shared.CREATE_USER.errors
            },

            GET_USERS: {
                description: "Gets users. Response has status code 200 if successful.",
                params: {
                    limit: "number of results",
                    start: "index to start results from"
                },
                errors: {
                    "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
                }
            },

            GET_USER: {
                description: "Gets user by id. Response has status code 200 if successful.",
                errors: {
                    "user-service.NOT_FOUND": "User not found.",
                    "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
                },
                params: {
                    id: "The id of the user to get."
                }
            },

            UPDATE_USER: {
                description: shared.UPDATE_USER.description,
                errors: shared.UPDATE_USER.errors,
                params: {
                    id: "The id of the user to update."
                }
            },

            DELETE_USER: {
                description: shared.DELETE_USER.description,
                errors: shared.DELETE_USER.errors,
                params: {
                    id: "The id of the user to delete."
                }
            }

        },

        VERIFY_EMAIL: {
            description: "Verifies a user's email address by providing a token sent to the user by email. Response has status code 200 if successful.",
            params: {
                tokenId: "The email verification token to verify with."
            },
            errors: {
                "INVALID_TOKEN": "Provided token is invalid. Either it's a faulty token or it has already been used.",
                "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
            }
        },

        RESEND_VERIFICATION_EMAIL: {
            description: "Generates a new email verification token and resends email w/ token to the provided user. Response has status code 200 if successful.",
            params: {
                email: "The email address to resent the verification email to."
            },
            errors: {
                "user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
            }
        }

    }

}