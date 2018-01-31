const bus = require("fruster-bus");
const mongo = require("mongodb");
const Db = mongo.Db;
const config = require("./config");
const constants = require("./lib/constants.js");
const expressApp = require("./web/express-app");


module.exports = {

	start: async (busAddress, mongoUrl) => {

		await bus.connect(busAddress);
		const db = await mongo.connect(mongoUrl);

		createIndexes(db);

		// REPOS
		const UserRepo = require("./lib/repos/UserRepo");
		const userRepo = new UserRepo(db);

		const InitialUserRepo = require("./lib/repos/InitialUserRepo");
		const initialUserRepo = new InitialUserRepo(db);

		const RoleScopesDbRepo = require("./lib/repos/RoleScopesDbRepo");
		const roleScopesDbRepo = new RoleScopesDbRepo(db);

		const RoleScopesConfigRepo = require("./lib/repos/RoleScopesConfigRepo");
		const roleScopesConfigRepo = new RoleScopesConfigRepo();
		await roleScopesConfigRepo.prepareRoles();

		// SERVICES
		const PasswordService = require("./lib/services/PasswordService");
		const passwordService = new PasswordService();

		const RoleService = require("./lib/services/RoleService");
		const roleService = new RoleService(config.useDbRolesAndScopes ? roleScopesDbRepo : roleScopesConfigRepo);

		// HANDLERS
		const CreateInitialUserHandler = require("./lib/handlers/CreateInitialUserHandler");
		const createInitialUserHandler = new CreateInitialUserHandler(userRepo, initialUserRepo, passwordService);
		await createInitialUserHandler.handle();

		// CREATE
		const CreateUserHandler = require("./lib/handlers/CreateUserHandler");
		const createUserHandler = new CreateUserHandler(userRepo, passwordService, roleService);

		// READ
		/** DEPRECATED */
		const GetUserHandler = require("./lib/handlers/GetUserHandler");
		/** DEPRECATED */
		const getUserHandler = new GetUserHandler(userRepo, roleService);

		const GetUsersByQueryHandler = require("./lib/handlers/GetUsersByQueryHandler");
		const getUsersByQueryHandler = new GetUsersByQueryHandler(userRepo, roleService);

		const GetUserByIdHandler = require("./lib/handlers/GetUserByIdHandler");
		const getUserByIdHandler = new GetUserByIdHandler(userRepo, roleService);

		const GetScopesForRolesHandler = require("./lib/handlers/GetScopesForRolesHandler");
		const getScopesForRolesHandler = new GetScopesForRolesHandler(roleService);

		// UPDATE
		const UpdateUserHandler = require("./lib/handlers/UpdateUserHandler");
		const updateUserHandler = new UpdateUserHandler(userRepo);

		// DELETE
		const DeleteUserHandler = require("./lib/handlers/DeleteUserHandler");
		const deleteUserHandler = new DeleteUserHandler(userRepo);

		// PASSWORD
		const ValidatePasswordHandler = require("./lib/handlers/ValidatePasswordHandler");
		const validatePasswordHandler = new ValidatePasswordHandler(userRepo, passwordService, roleService);

		const UpdatePasswordHandler = require("./lib/handlers/UpdatePasswordHandler");
		const updatePasswordHandler = new UpdatePasswordHandler(userRepo, passwordService);

		const SetPasswordHandler = require("./lib/handlers/SetPasswordHandler");
		const setPasswordHandler = new SetPasswordHandler(userRepo, passwordService);

		// ROLES
		const AddRolesHandler = require("./lib/handlers/AddRolesHandler");
		const addRolesHandler = new AddRolesHandler(userRepo, roleService);

		const RemoveRolesHandler = require("./lib/handlers/RemoveRolesHandler");
		const removeRolesHandler = new RemoveRolesHandler(userRepo, roleService);

		// EMAIL VERIFICATION
		const VerifyEmailAddressHandler = require("./lib/handlers/email-verification/VerifyEmailAddressHandler.js");
		const verifyEmailAddressHandler = new VerifyEmailAddressHandler(userRepo);

		const ResendVerificationEmailHandler = require("./lib/handlers/email-verification/ResendVerificationEmailHandler.js");
		const resendVerificationEmailHandler = new ResendVerificationEmailHandler(userRepo);

		// ENDPOINTS ///////////////////////////////////////////////////////////////////////////////

		const docs = require("./lib/docs");

		// ROLES & SCOPES, if configured
		if (config.useDbRolesAndScopes) {
			await roleScopesDbRepo.prepareRoles();

			// SYSTEM ROLES
			const AddSystemRoleHandler = require("./lib/handlers/system/AddSystemRoleHandler");
			const addSystemRoleHandler = new AddSystemRoleHandler(roleScopesDbRepo);

			const AddSystemRoleScopesHandler = require("./lib/handlers/system/AddSystemRoleScopesHandler");
			const addSystemRoleScopesHandler = new AddSystemRoleScopesHandler(roleScopesDbRepo);

			const GetSystemRolesHandler = require("./lib/handlers/system/GetSystemRolesHandler");
			const getSystemRolesHandler = new GetSystemRolesHandler(roleScopesDbRepo);

			const RemoveSystemRoleHandler = require("./lib/handlers/system/RemoveSystemRoleHandler");
			const removeSystemRoleHandler = new RemoveSystemRoleHandler(roleScopesDbRepo);

			const RemoveSystemRoleScopesHandler = require("./lib/handlers/system/RemoveSystemRoleScopesHandler");
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

		/** DEPRECATED */
		bus.subscribe({
			// @ts-ignore
			deprecated: true,
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
			subject: constants.endpoints.service.UPDATE_USER,
			requestSchema: constants.schemas.request.UPDATE_USER_REQUEST,
			responseSchema: constants.schemas.response.USER_RESPONSE,
			docs: docs.service.UPDATE_USER,
			handle: (req) => updateUserHandler.handle(req)
		});

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

		if (!busAddress.includes("mock") && (config.requireEmailVerification || config.useDbRolesAndScopes))
			expressApp.start(config.port);
	},

	stop: () => {
		if (config.requireEmailVerification || config.useDbRolesAndScopes) {
			expressApp.stop();
		}
	}

};

/**
 * @param {Db} db 
 */
function createIndexes(db) {
	db.collection(config.userCollection)
		.createIndex({
			email: 1
		}, {
			unique: true,
			partialFilterExpression: {
				email: {
					$exists: true
				}
			}
		});

	config.uniqueIndexes.forEach(index => {
		const indexObj = {};
		indexObj[index] = 1;
		db.collection(config.userCollection)
			.createIndex(indexObj, {
				unique: true
			});
	});

	return db;
}