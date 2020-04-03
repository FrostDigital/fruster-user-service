const config = require("../config");
const constants = require("./constants");
const Publishes = require("./Publishes");

const shared = {

	CREATE_USER: {
		description: "Creates a fruster user. Must include a few base fields but can contain any number of custom fields. Response has status code `201` if successful. Automatically splits data between user and profile if configured to.",
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
		description: "Updates a user. Can contain any number of custom fields. Response has status code `200` if successful. ",
		errors: {
			"user-service.404.1": "User not found.",
			"user-service.400.6": "Cannot update password. Cannot update password through user update",
			"user-service.400.10": "Email is not unique. Another account has already been registered with the provided email-address.",
			"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
		}
	},

	DELETE_USER: {
		description: `Deletes a user. Response has status code \`200\` if successful. \`${Publishes.subjects.USER_DELETED}\` is published after deletion`,
		errors: {
			"user-service.NOT_FOUND": "User not found",
			"user-service.400.12": "Invalid id. Provided id does not follow the configured id validation.",
			"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
		}
	}

};

module.exports = {

	deprecated: {

		GET_USER: "Use user-service.get-users-by-query instead."

	},

	service: {

		CREATE_USER: {
			description: shared.CREATE_USER.description,
			errors: shared.CREATE_USER.errors
		},

		/** DEPRECATED */
		GET_USER: {
			description: "Gets users by query. Response has status code `200` if successful.",
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened.",
				"user-service.400.13": "Invalid json. Query includes salt or password or query is empty (and config.allowGetAll is false)"
			}
		},

		GET_USERS_BY_QUERY: {
			description: `Gets users by query.  **Note:** Return data may vary depending on the configuration. Configured user fields: **${config.userFields.join(",")}** (Will always return id,email,password,roles,scopes) \n\n Can be expanded to return both user and profile data using \`expand: "profile"\` if configured to split the data. If expand is used; the query can be used to query profile fields as well: \`{ "profile.firstName": "Bob" }\`. With expand; the data is returned \`{...userData, profile: {...profileData}}\``,
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened.",
				"user-service.400.13": "Invalid json. Query includes salt or password or query is empty (and config.allowGetAll is false)"
			}
		},

		GET_USERS_BY_AGGREGATE: {
			description: `Gets users by aggregate.`,
			errors: {
				"INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		},

		GET_PROFILES_BY_QUERY: {
			description: `Gets profiles by query. **Note:** Return data may vary depending on the configuration. Configured profile fields: **${config.profileFields.join(",")}** ${config.profileFields.includes(constants.dataset.ALL_FIELDS) ? `(Everything except the fields configured for [user](#user-service.get-users-by-query))` : ""}`,
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened.",
				"user-service.400.13": "Invalid json. Query is empty and config.allowGetAll is false"
			}
		},

		UPDATE_USER: {
			description: shared.UPDATE_USER.description,
			errors: shared.UPDATE_USER.errors
		},

		UPDATE_PROFILE: {
			description: "Updates a profile. Can contain any number of custom fields. Response has status code `200` if successful. Profile and user id is the same.",
			errors: {
				"user-service.404.1": "Profile not found.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		},

		VALIDATE_PASSWORD: {
			description: `Validates that inputted password becomes the same hash as for an account. Typically used by auth service for login. Response has status code \`200\` if successful. Validation can be done on ${config.usernameValidationDbField.join(",")}`,
			errors: {
				"user-service.EMAIL_NOT_VERIFIED": "Email has not yet been verified.",
				"user-service.401.3": "Invalid username or password.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		},

		UPDATE_PASSWORD: {
			description: "Updates password of an account. Requires to validation of old password before new can be set. Response has status code `202` if successful.",
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

		DELETE_USERS_BY_QUERY: {
			description: `Deletes users by a query. Response has status code \`200\` if successful. \`${Publishes.subjects.USER_DELETED}\` is published after deletion. Request body is the query to delete with. Cannot use empty query.`,
			errors: {
				"fruster-user-service.BAD_REQUEST": "Invalid query; query cannot be empty"
			}
		},

		ADD_ROLES: {
			description: "Adds inputted roles to specified user. Can only add roles existing in configuration. Response has status code `202` if successful.",
			errors: {
				"user-service.404.1": "User not found.",
				"user-service.400.4": "Invalid roles. One or more inputted roles are invalid.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		},

		REMOVE_ROLES: {
			description: "Removes inputted roles from specified user. Cannot remove the last role. Response has status code `202` if successful.",
			errors: {
				"user-service.404.1": "User not found.",
				"user-service.400.4": "Invalid roles. One or more inputted roles are invalid.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		},

		GET_SCOPES_FOR_ROLES: {
			description: "Gets all scopes for specified roles in a flat array. E.g. input ['admin', 'user', 'super-admin'] would return  ['*', 'admin.*', 'profile.get']. Response has status code` 20`0 if successful.",
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		},

		SET_PASSWORD: {
			description: "Sets password of a user. Used by password reset service. Note: Updating a user's password should be done w/ the update-password endpoint. Response has status code `202` if successful.",
			errors: {
				"user-service.400.3": "Invalid password. Password does not follow the configured validation.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		},

		VERIFY_EMAIL: {
			description: "Verifies a user's email address by providing a token sent to the user by email. Response has status code `200` if successful.",
			errors: {
				"user-service.INVALID_TOKEN": "Provided token is invalid. Either it's a faulty token or it has already been used.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		},

		RESEND_VERIFICATION_EMAIL: {
			description: "Generates a new email verification token and resends email w/ token to the provided user. Response has status code `200` if successful.",
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
				description: "Gets users. Response has status code `200` if successful.",
				params: {
					limit: "number of results",
					start: "index to start results from"
				},
				errors: {
					"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
				}
			},

			GET_USER: {
				description: "Gets user by id. Response has status code `200` if successful.",
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
			},

			ADD_SYSTEM_ROLE: {
				description: "Adds a new system role.",
				errors: {
					"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened",
					"user-service.SYSTEM_ROLE_ALREADY_EXISTS": "The provided role already exists in the system."
				}
			},

			ADD_SYSTEM_ROLE_SCOPES: {
				description: "Adds one or more scopes to a system role.",
				params: {
					role: "The role to add the provided scope(s) to."
				},
				errors: {
					"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
				}
			},

			GET_SYSTEM_ROLES: {
				description: "Gets all system roles.",
				query: {
					format: `Output format. Supports "config" to output roles as a config string.`
				},
				errors: {
					"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
				}
			},

			REMOVE_SYSTEM_ROLE: {
				description: "Removes a system role.",
				errors: {
					"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
				}
			},

			REMOVE_SYSTEM_ROLE_SCOPES: {
				description: "Removes one or more scopes from a system role.",
				params: {
					role: "The role to remove the provided scope(s) from."
				},
				errors: {
					"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
				}
			}

		},

		VERIFY_EMAIL: {
			description: "Verifies a user's email address by providing a token sent to the user by email. Response has status code `200` if successful.",
			params: {
				tokenId: "The email verification token to verify with."
			},
			errors: {
				"user-service.INVALID_TOKEN": "Provided token is invalid. Either it's a faulty token or it has already been used.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
			}
		},

		RESEND_VERIFICATION_EMAIL: {
			description: "Generates a new email verification token and resends email w/ token to the provided user. Response has status code `200` if successful.",
			params: {
				email: "The email address to resent the verification email to."
			},
			errors: {
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened"
			}
		},

		UPDATE_PASSWORD: {
			description: "Updates password of auth user's account. Requires to validation of old password before new can be set. Response has status code `202` if successful.",
			errors: {
				"user-service.400.3": "Invalid password. Password does not follow the configured validation.",
				"user-service.401.3": "Invalid username or password.",
				"user-service.INTERNAL_SERVER_ERROR": "Something unexpected happened."
			}
		}

	}

}
