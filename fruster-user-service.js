const bus = require("fruster-bus");
const mongo = require("mongodb");
const conf = require("./config");
const constants = require('./lib/constants.js');
const expressApp = require("./web/express-app");

// REPOS ///
const UserRepo = require("./lib/repos/UserRepo");
const InitialUserRepo = require("./lib/repos/InitialUserRepo");

// SERVICES ///
const PasswordService = require("./lib/services/PasswordService");
const RoleService = require("./lib/services/RoleService");

/// HANDLERS ///

// CREATE
const CreateUserHandler = require("./lib/handlers/CreateUserHandler");

// READ
const GetUserHandler = require("./lib/handlers/GetUserHandler");
const GetUserByIdHandler = require("./lib/handlers/GetUserByIdHandler");
const GetScopesForRolesHandler = require("./lib/handlers/GetScopesForRolesHandler");

// UPDATE
const updateUser = require("./lib/update-user");
const updateUserHttp = require("./lib/http/update-user-http");

// DELETE
const DeleteUserHandler = require("./lib/handlers/DeleteUserHandler");

// PASSWORD
const ValidatePasswordHandler = require("./lib/handlers/ValidatePasswordHandler");
const UpdatePasswordHandler = require("./lib/handlers/UpdatePasswordHandler");
const SetPasswordHandler = require("./lib/handlers/SetPasswordHandler");

// ROLES
const AddRolesHandler = require("./lib/handlers/AddRolesHandler");
const RemoveRolesHandler = require("./lib/handlers/RemoveRolesHandler");

// INITIAL USER
const CreateInitialUserHandler = require("./lib/handlers/CreateInitialUserHandler");

// EMAIL VERIFICATION
const VerifyEmailAddressHandler = require('./lib/handlers/email-verification/VerifyEmailAddressHandler.js');
const ResendVerificationEmailHandler = require('./lib/handlers/email-verification/ResendVerificationEmailHandler.js');


module.exports = {

	start: async (busAddress, mongoUrl) => {

		await bus.connect(busAddress);
		const db = await mongo.connect(mongoUrl);

		const database = db.collection(conf.userCollection);
		createIndexes(db);

		// REPOS
		const userRepo = new UserRepo(db);
		const initialUserRepo = new InitialUserRepo(db);

		const createInitialUserHandler = new CreateInitialUserHandler(userRepo, initialUserRepo);
		await createInitialUserHandler.handle();

		// SERVICES
		const passwordService = new PasswordService(userRepo);
		const roleService = new RoleService();

		// CREATE
		const createUserHandler = new CreateUserHandler(userRepo, passwordService);

		// READ
		const getUserHandler = new GetUserHandler(userRepo);
		const getUserByIdHandler = new GetUserByIdHandler(userRepo);
		const getScopesForRolesHandler = new GetScopesForRolesHandler(roleService);

		// UPDATE
		updateUser.init(database);
		updateUserHttp.init(updateUser);

		// DELETE
		const deleteUserHandler = new DeleteUserHandler(userRepo);

		// PASSWORD
		const validatePasswordHandler = new ValidatePasswordHandler(userRepo, passwordService);
		const updatePasswordHandler = new UpdatePasswordHandler(userRepo, passwordService);
		const setPasswordHandler = new SetPasswordHandler(userRepo, passwordService);

		// ROLES
		const addRolesHandler = new AddRolesHandler(userRepo, roleService);
		const removeRolesHandler = new RemoveRolesHandler(userRepo, roleService);

		// EMAIL VERIFICATION
		const verifyEmailAddressHandler = new VerifyEmailAddressHandler(database, updateUser);
		const resendVerificationEmailHandler = new ResendVerificationEmailHandler(database);

		// ENDPOINTS ///////////////////////////////////////////////////////////////////////////////

		// HTTP
		bus.subscribe({
			subject: constants.endpoints.http.admin.CREATE_USER,
			requestSchema: constants.schemas.request.CREATE_USER_REQUEST,
			responseSchema: constants.schemas.response.USER_RESPONSE,
			permissions: [constants.permissions.ADMIN_ANY],
			// docs: TODO:
			handle: (req) => createUserHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.http.admin.GET_USERS,
			permissions: [constants.permissions.ADMIN_ANY],
			// docs: TODO:
			handle: (req) => getUserHandler.handleHttp(req)
		});

		bus.subscribe({
			subject: constants.endpoints.http.admin.GET_USER,
			responseSchema: constants.schemas.response.USER_RESPONSE,
			permissions: [constants.permissions.ADMIN_ANY],
			// docs: TODO:
			handle: (req) => getUserByIdHandler.handleHttp(req)
		});

		bus.subscribe({
			subject: constants.endpoints.http.admin.DELETE_USER,
			permissions: [constants.permissions.ADMIN_ANY],
			// docs: TODO:
			handle: (req) => deleteUserHandler.handleHttp(req)
		});

		bus.subscribe({
			subject: constants.endpoints.http.VERIFY_EMAIL,
			// docs: TODO:
			handle: (req) => verifyEmailAddressHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.http.RESEND_VERIFICATION_EMAIL,
			// docs: TODO:
			handle: (req) => resendVerificationEmailHandler.handle(req)
		});

		// UNREFACTORED HTTP BELOW
		bus.subscribe(constants.endpoints.http.admin.UPDATE_USER, updateUserHttp.handle).permissions([constants.permissions.ADMIN_ANY]);

		// SERVICE
		bus.subscribe({
			subject: constants.endpoints.service.CREATE_USER,
			requestSchema: constants.schemas.request.CREATE_USER_REQUEST,
			responseSchema: constants.schemas.response.USER_RESPONSE,
			// docs: TODO:
			handle: (req) => createUserHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.GET_USER,
			responseSchema: constants.schemas.response.USER_LIST_RESPONSE,
			// docs: TODO:
			handle: (req) => getUserHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.VALIDATE_PASSWORD,
			requestSchema: constants.schemas.request.VALIDATE_PASSWORD_REQUEST,
			responseSchema: constants.schemas.response.USER_RESPONSE,
			// docs: TODO:
			handle: (req) => validatePasswordHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.UPDATE_PASSWORD,
			requestSchema: constants.schemas.request.UPDATE_PASSWORD_REQUEST,
			// docs: TODO:
			handle: (req) => updatePasswordHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.ADD_ROLES,
			requestSchema: constants.schemas.request.ADD_AND_REMOVE_ROLES_REQUEST,
			// docs: TODO:
			handle: (req) => addRolesHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.REMOVE_ROLES,
			requestSchema: constants.schemas.request.ADD_AND_REMOVE_ROLES_REQUEST,
			// docs: TODO:
			handle: (req) => removeRolesHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.GET_SCOPES_FOR_ROLES,
			requestSchema: constants.schemas.request.GET_SCOPES_FOR_ROLES,
			// docs: TODO:
			handle: (req) => getScopesForRolesHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.DELETE_USER,
			requestSchema: constants.schemas.request.DELETE_USER_REQUEST,
			// docs: TODO:
			handle: (req) => deleteUserHandler.handle(req),
		});

		bus.subscribe({
			subject: constants.endpoints.service.SET_PASSWORD,
			requestSchema: constants.schemas.request.SET_PASSWORD_REQUEST,
			// docs: TODO:
			handle: (req) => setPasswordHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.VERIFY_EMAIL,
			// docs: TODO:
			handle: (req) => verifyEmailAddressHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.RESEND_VERIFICATION_EMAIL,
			// docs: TODO:
			handle: (req) => resendVerificationEmailHandler.handle(req)
		});

		// UNREFACTORED SERVICE BELOW
		bus.subscribe(constants.endpoints.service.UPDATE_USER, updateUser.handle);


		if (conf.requireEmailVerification)
			expressApp.start(conf.port);
	},

	stop: () => {
		if (conf.requireEmailVerification) {
			expressApp.stop();
		}
	}

};

function createIndexes(db) {
	db.collection(conf.userCollection)
		.createIndex({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true } } });

	conf.uniqueIndexes.forEach(index => {
		const indexObj = {};
		indexObj[index] = 1;
		db.collection(conf.userCollection)
			.createIndex(indexObj, { unique: true });
	});

	return db;
}