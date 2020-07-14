const UserRepo = require("./lib/repos/UserRepo");
const ProfileRepo = require("./lib/repos/ProfileRepo");
const InitialUserRepo = require("./lib/repos/InitialUserRepo");
const RoleScopesDbRepo = require("./lib/repos/RoleScopesDbRepo");
const RoleScopesConfigRepo = require("./lib/repos/RoleScopesConfigRepo");

const PasswordManager = require("./lib/managers/PasswordManager");
const RoleManager = require("./lib/managers/RoleManager");
const ProfileManager = require("./lib/managers/ProfileManager");
const UserManager = require("./lib/managers/UserManager");

const CreateInitialUserHandler = require("./lib/handlers/CreateInitialUserHandler");
const CreateUserHandler = require("./lib/handlers/CreateUserHandler");
const GetUserHandler = require("./lib/handlers/GetUserHandler"); /** DEPRECATED */
const GetUsersByQueryHandler = require("./lib/handlers/GetUsersByQueryHandler");
const GetUsersByAggregateHandler = require("./lib/handlers/GetUsersByAggregateHandler");
const GetUserByIdHandler = require("./lib/handlers/GetUserByIdHandler");
const GetScopesForRolesHandler = require("./lib/handlers/GetScopesForRolesHandler");
const UpdateUserHandler = require("./lib/handlers/UpdateUserHandler");
const DeleteUserHandler = require("./lib/handlers/DeleteUserHandler");
const DeleteUsersByQueryHandler = require("./lib/handlers/DeleteUsersByQueryHandler");
const ValidatePasswordHandler = require("./lib/handlers/ValidatePasswordHandler");
const UpdatePasswordHandler = require("./lib/handlers/UpdatePasswordHandler");
const SetPasswordHandler = require("./lib/handlers/SetPasswordHandler");
const AddRolesHandler = require("./lib/handlers/AddRolesHandler");
const RemoveRolesHandler = require("./lib/handlers/RemoveRolesHandler");
const VerifyEmailAddressHandler = require("./lib/handlers/email-verification/VerifyEmailAddressHandler.js");
const ResendVerificationEmailHandler = require("./lib/handlers/email-verification/ResendVerificationEmailHandler.js");
const AddSystemRoleHandler = require("./lib/handlers/system/AddSystemRoleHandler");
const AddSystemRoleScopesHandler = require("./lib/handlers/system/AddSystemRoleScopesHandler");
const GetSystemRolesHandler = require("./lib/handlers/system/GetSystemRolesHandler");
const RemoveSystemRoleHandler = require("./lib/handlers/system/RemoveSystemRoleHandler");
const RemoveSystemRoleScopesHandler = require("./lib/handlers/system/RemoveSystemRoleScopesHandler");

const GetProfilesByQueryHandler = require("./lib/handlers/GetProfilesByQueryHandler");
const UpdateProfileHandler = require("./lib/handlers/UpdateProfileHandler");

const bus = require("fruster-bus");
const mongo = require("mongodb");
const Db = mongo.Db;
const config = require("./config");
const constants = require("./lib/constants.js");
const expressApp = require("./web/express-app");
const docs = require("./lib/docs");
const log = require("fruster-log");

module.exports = {
	start: async (busAddress, mongoUrl) => {

		await bus.connect(busAddress);
		const db = await mongo.connect(mongoUrl);

		try {
			await createIndexes(db);
		} catch (err) {
			log.warn("Error while creating indexes", err);
		}

		// REPOS
		const userRepo = new UserRepo(db);
		const profileRepo = new ProfileRepo(db);
		const initialUserRepo = new InitialUserRepo(db);
		const roleScopesDbRepo = new RoleScopesDbRepo(db);

		const roleScopesConfigRepo = new RoleScopesConfigRepo();
		await roleScopesConfigRepo.prepareRoles();

		// MANAGERS
		const passwordManager = new PasswordManager(userRepo);
		const roleManager = new RoleManager(config.useDbRolesAndScopes ? roleScopesDbRepo : roleScopesConfigRepo);
		const profileManager = new ProfileManager(profileRepo);
		const userManager = new UserManager(passwordManager, roleManager, userRepo);

		// HANDLERS
		const createInitialUserHandler = new CreateInitialUserHandler(userRepo, initialUserRepo, passwordManager);
		await createInitialUserHandler.handle();
		const createUserHandler = new CreateUserHandler(userRepo, passwordManager, roleManager, profileManager, userManager);
		const getUserHandler = new GetUserHandler(userRepo, roleManager); /** DEPRECATED */
		const getUsersByQueryHandler = new GetUsersByQueryHandler(userRepo, roleManager, profileManager);
		const getUsersByAggregateHandler = new GetUsersByAggregateHandler(userRepo, roleManager);
		const getUserByIdHandler = new GetUserByIdHandler(userRepo, roleManager, profileManager);
		const getScopesForRolesHandler = new GetScopesForRolesHandler(roleManager);
		const updateUserHandler = new UpdateUserHandler(userRepo, passwordManager, roleManager, profileManager, userManager);
		const deleteUserHandler = new DeleteUserHandler(userRepo, profileRepo);
		const deleteUsersByQueryHandler = new DeleteUsersByQueryHandler(userRepo, profileRepo);
		const validatePasswordHandler = new ValidatePasswordHandler(userRepo, passwordManager, roleManager);
		const updatePasswordHandler = new UpdatePasswordHandler(userRepo, passwordManager);
		const setPasswordHandler = new SetPasswordHandler(userRepo, passwordManager);
		const addRolesHandler = new AddRolesHandler(userRepo, roleManager);
		const removeRolesHandler = new RemoveRolesHandler(userRepo, roleManager);
		const verifyEmailAddressHandler = new VerifyEmailAddressHandler(userRepo);
		const resendVerificationEmailHandler = new ResendVerificationEmailHandler(userRepo, roleManager);

		const getProfilesByQueryHandler = new GetProfilesByQueryHandler(roleManager, profileManager);
		const updateProfileHandler = new UpdateProfileHandler(profileRepo, userManager, profileManager);

		// ROLES & SCOPES, if configured
		if (config.useDbRolesAndScopes) {
			await roleScopesDbRepo.prepareRoles();

			// SYSTEM ROLES
			const addSystemRoleHandler = new AddSystemRoleHandler(roleScopesDbRepo);
			const addSystemRoleScopesHandler = new AddSystemRoleScopesHandler(roleScopesDbRepo);
			const getSystemRolesHandler = new GetSystemRolesHandler(roleScopesDbRepo);
			const removeSystemRoleHandler = new RemoveSystemRoleHandler(roleScopesDbRepo);
			const removeSystemRoleScopesHandler = new RemoveSystemRoleScopesHandler(roleScopesDbRepo);

			bus.subscribe({
				subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE,
				permissions: [constants.permissions.ADD_SYSTEM_ROLE],
				requestSchema: constants.schemas.request.ADD_SYSTEM_ROLE_REQUEST,
				responseSchema: constants.schemas.response.ROLE_MODEL,
				docs: docs.http.admin.ADD_SYSTEM_ROLE,
				handle: (req) => addSystemRoleHandler.handle(req)
			});

			bus.subscribe({
				subject: constants.endpoints.http.admin.ADD_SYSTEM_ROLE_SCOPES,
				permissions: [constants.permissions.ADD_SYSTEM_ROLE_SCOPES],
				requestSchema: constants.schemas.request.ADD_SYSTEM_ROLE_SCOPES_REQUEST,
				responseSchema: constants.schemas.response.ROLE_MODEL,
				docs: docs.http.admin.ADD_SYSTEM_ROLE_SCOPES,
				handle: (req) => addSystemRoleScopesHandler.handle(req)
			});

			bus.subscribe({
				subject: constants.endpoints.http.admin.GET_SYSTEM_ROLES,
				permissions: [constants.permissions.GET_SYSTEM_ROLES],
				responseSchema: constants.schemas.response.ROLE_MODEL_LIST_RESPONSE,
				docs: docs.http.admin.GET_SYSTEM_ROLES,
				handle: (req) => getSystemRolesHandler.handle(req)
			});

			bus.subscribe({
				subject: constants.endpoints.http.admin.REMOVE_SYSTEM_ROLE,
				permissions: [constants.permissions.REMOVE_SYSTEM_ROLE],
				docs: docs.http.admin.REMOVE_SYSTEM_ROLE,
				handle: (req) => removeSystemRoleHandler.handle(req)
			});

			bus.subscribe({
				subject: constants.endpoints.http.admin.REMOVE_SYSTEM_ROLE_SCOPES,
				permissions: [constants.permissions.REMOVE_SYSTEM_ROLE_SCOPES],
				requestSchema: constants.schemas.request.REMOVE_SYSTEM_ROLE_SCOPES,
				responseSchema: constants.schemas.response.ROLE_MODEL,
				docs: docs.http.admin.REMOVE_SYSTEM_ROLE_SCOPES,
				handle: (req) => removeSystemRoleScopesHandler.handle(req)
			});

		}

		// HTTP
		bus.subscribe({
			subject: constants.endpoints.http.admin.CREATE_USER,
			requestSchema: constants.schemas.request.CREATE_USER_REQUEST,
			responseSchema: constants.schemas.response.USER_RESPONSE,
			permissions: [constants.permissions.ADMIN_ANY],
			mustBeLoggedIn: true,
			docs: docs.http.admin.CREATE_USER,
			handle: (req) => createUserHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.http.admin.GET_USERS,
			responseSchema: constants.schemas.response.USER_LIST_RESPONSE,
			permissions: [constants.permissions.ADMIN_ANY],
			mustBeLoggedIn: true,
			docs: docs.http.admin.GET_USERS,
			handle: (req) => getUserHandler.handleHttp(req)
		});

		bus.subscribe({
			subject: constants.endpoints.http.admin.GET_USER,
			responseSchema: constants.schemas.response.USER_RESPONSE,
			permissions: [constants.permissions.ADMIN_ANY],
			mustBeLoggedIn: true,
			docs: docs.http.admin.GET_USER,
			handle: (req) => getUserByIdHandler.handleHttp(req)
		});

		bus.subscribe({
			subject: constants.endpoints.http.admin.UPDATE_USER,
			requestSchema: constants.schemas.request.UPDATE_USER_HTTP_REQUEST,
			responseSchema: constants.schemas.response.USER_RESPONSE,
			permissions: [constants.permissions.ADMIN_ANY],
			mustBeLoggedIn: true,
			docs: docs.http.admin.UPDATE_USER,
			handle: (req) => updateUserHandler.handleHttp(req)
		});

		bus.subscribe({
			subject: constants.endpoints.http.admin.DELETE_USER,
			permissions: [constants.permissions.ADMIN_ANY],
			mustBeLoggedIn: true,
			docs: docs.http.admin.DELETE_USER,
			handle: (req) => deleteUserHandler.handleHttp(req)
		});

		bus.subscribe({
			subject: constants.endpoints.http.VERIFY_EMAIL,
			responseSchema: constants.schemas.response.VERIFY_EMAIL_ADDRESS_RESPONSE,
			docs: docs.http.VERIFY_EMAIL,
			handle: (req) => verifyEmailAddressHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.http.RESEND_VERIFICATION_EMAIL,
			docs: docs.http.RESEND_VERIFICATION_EMAIL,
			handle: (req) => resendVerificationEmailHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.http.UPDATE_PASSWORD,
			requestSchema: constants.schemas.request.UPDATE_PASSWORD_HTTP_REQUEST,
			mustBeLoggedIn: true,
			docs: docs.http.UPDATE_PASSWORD,
			handle: (req) => updatePasswordHandler.handleHttp(req)
		});

		// SERVICE
		bus.subscribe({
			subject: constants.endpoints.service.CREATE_USER,
			requestSchema: constants.schemas.request.CREATE_USER_REQUEST,
			responseSchema: constants.schemas.response.USER_RESPONSE,
			docs: docs.service.CREATE_USER,
			handle: (req) => createUserHandler.handle(req)
		});

		bus.subscribe({ /** DEPRECATED */
			deprecated: docs.deprecated.GET_USER,
			subject: constants.endpoints.service.GET_USER,
			responseSchema: constants.schemas.response.USER_LIST_RESPONSE,
			docs: docs.service.GET_USER,
			handle: (req) => getUserHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.GET_USERS_BY_QUERY,
			requestSchema: constants.schemas.request.GET_USERS_BY_QUERY,
			responseSchema: constants.schemas.response.GET_USERS_BY_QUERY_RESPONSE,
			docs: docs.service.GET_USERS_BY_QUERY,
			handle: (req) => getUsersByQueryHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.GET_USERS_BY_AGGREGATE,
			requestSchema: constants.schemas.request.GET_USERS_BY_AGGREGATE,
			responseSchema: constants.schemas.response.GET_USERS_BY_AGGREGATE,
			docs: docs.service.GET_USERS_BY_AGGREGATE,
			handle: (req) => getUsersByAggregateHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.UPDATE_USER,
			requestSchema: constants.schemas.request.UPDATE_USER_REQUEST,
			responseSchema: constants.schemas.response.USER_RESPONSE,
			docs: docs.service.UPDATE_USER,
			handle: (req) => updateUserHandler.handle(req)
		});

		if (!(config.profileFields.includes(constants.dataset.ALL_FIELDS) && config.userFields.includes(constants.dataset.ALL_FIELDS))) {
			/**
			 * We only register these endpoints if configured to split user into user and profile.
			 * Default config is config.profileFields = ALL & config.userFields = ALL ( Which means no splitting will be done ).
			 */

			bus.subscribe({
				subject: constants.endpoints.service.GET_PROFILES_BY_QUERY,
				requestSchema: constants.schemas.request.GET_PROFILES_BY_QUERY,
				responseSchema: constants.schemas.response.GET_PROFILES_BY_QUERY,
				docs: docs.service.GET_PROFILES_BY_QUERY,
				handle: (req) => getProfilesByQueryHandler.handle(req)
			});

			bus.subscribe({
				subject: constants.endpoints.service.UPDATE_PROFILE,
				requestSchema: constants.schemas.request.UPDATE_PROFILE_REQUEST,
				responseSchema: constants.schemas.request.USER_RESPONSE,
				docs: docs.service.UPDATE_USER,
				handle: (req) => updateProfileHandler.handle(req)
			});

		}

		bus.subscribe({
			subject: constants.endpoints.service.VALIDATE_PASSWORD,
			requestSchema: constants.schemas.request.VALIDATE_PASSWORD_REQUEST,
			responseSchema: constants.schemas.response.USER_RESPONSE,
			docs: docs.service.VALIDATE_PASSWORD,
			handle: (req) => validatePasswordHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.UPDATE_PASSWORD,
			requestSchema: constants.schemas.request.UPDATE_PASSWORD_REQUEST,
			docs: docs.service.UPDATE_PASSWORD,
			handle: (req) => updatePasswordHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.DELETE_USER,
			requestSchema: constants.schemas.request.DELETE_USER_REQUEST,
			docs: docs.service.DELETE_USER,
			handle: (req) => deleteUserHandler.handle(req),
		});

		bus.subscribe({
			subject: constants.endpoints.service.DELETE_USERS_BY_QUERY,
			requestSchema: constants.schemas.request.DELETE_USERS_BY_QUERY,
			docs: docs.service.DELETE_USERS_BY_QUERY,
			handle: (req) => deleteUsersByQueryHandler.handle(req),
		});

		bus.subscribe({
			subject: constants.endpoints.service.ADD_ROLES,
			requestSchema: constants.schemas.request.ADD_AND_REMOVE_ROLES_REQUEST,
			docs: docs.service.ADD_ROLES,
			handle: (req) => addRolesHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.REMOVE_ROLES,
			requestSchema: constants.schemas.request.ADD_AND_REMOVE_ROLES_REQUEST,
			docs: docs.service.REMOVE_ROLES,
			handle: (req) => removeRolesHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.GET_SCOPES_FOR_ROLES,
			requestSchema: constants.schemas.request.GET_SCOPES_FOR_ROLES,
			responseSchema: constants.schemas.response.STRING_ARRAY_RESPONSE,
			docs: docs.service.GET_SCOPES_FOR_ROLES,
			handle: (req) => getScopesForRolesHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.SET_PASSWORD,
			requestSchema: constants.schemas.request.SET_PASSWORD_REQUEST,
			docs: docs.service.SET_PASSWORD,
			handle: (req) => setPasswordHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.VERIFY_EMAIL,
			requestSchema: constants.schemas.request.VERIFY_EMAIL_ADDRESS_SERVICE_REQUEST,
			responseSchema: constants.schemas.response.VERIFY_EMAIL_ADDRESS_RESPONSE,
			docs: docs.service.VERIFY_EMAIL,
			handle: (req) => verifyEmailAddressHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.RESEND_VERIFICATION_EMAIL,
			requestSchema: constants.schemas.request.RESEND_VERIFICATION_EMAIL_REQUEST,
			docs: docs.service.RESEND_VERIFICATION_EMAIL,
			handle: (req) => resendVerificationEmailHandler.handle(req)
		});

		if (!busAddress.includes("mock") && (config.requireEmailVerification || config.useDbRolesAndScopes || config.optionalEmailVerification))
			expressApp.start(config.port);
	},

	stop: () => {
		if (config.requireEmailVerification || config.optionalEmailVerification || config.useDbRolesAndScopes)
			expressApp.stop();
	}

};

/**
 * @param {Db} db
 */
async function createIndexes(db) {
	if (config.usernameValidationDbField.includes("email") && !config.skipEmailUniqueIndex)
		await db.collection(constants.collections.USERS)
			.createIndex({ email: 1 }, {
				unique: true,
				partialFilterExpression: { email: { $exists: true } }
			});

	if (!config.uniqueIndexes.includes("id"))
		config.uniqueIndexes.push("id");

	if (!(config.profileFields.includes(constants.dataset.ALL_FIELDS) && config.userFields.includes(constants.dataset.ALL_FIELDS)))
		config.uniqueIndexes.push("profile.id");

	config.uniqueIndexes.forEach(async index => {
		const indexObj = {};
		if (index.includes("profile")) {
			indexObj[index.replace("profile.", "")] = 1;
			await db.collection(constants.collections.PROFILES).createIndex(indexObj, { unique: true });
		} else {
			indexObj[index] = 1;
			await db.collection(constants.collections.USERS).createIndex(indexObj, { unique: true });
		}
	});

	return db;
}
