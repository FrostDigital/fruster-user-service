const bus = require("fruster-bus");
const mongo = require("mongodb");
const conf = require("./config");
const constants = require('./lib/constants.js');
const expressApp = require("./web/express-app");

// REPOS
const UserRepo = require("./lib/repos/UserRepo");

// SERVICES
const PasswordService = require("./lib/services/PasswordService");
const RoleService = require("./lib/services/RoleService");

/// HANDLERS

// CREATE
const CreateUserHandler = require("./lib/handlers/CreateUserHandler");

// READ
const GetUserHandler = require("./lib/GetUserHandler");
const GetUserByIdHandler = require("./lib/GetUserByIdHandler");
const GetScopesHandler = require("./lib/handlers/GetScopesHandler");

// UPDATE
const updateUser = require("./lib/update-user");
const updateUserHttp = require("./lib/http/update-user-http");

// DELETE
const deleteUser = require("./lib/delete-user");
const deleteUserHttp = require("./lib/http/delete-user-http");

// PASSWORD
const ValidatePasswordHandler = require("./lib/handlers/ValidatePasswordHandler");
const UpdatePasswordHandler = require("./lib/handlers/UpdatePasswordHandler");
const setPassword = require("./lib/set-password");

// ROLES
const AddRolesHandler = require("./lib/handlers/AddRolesHandler");
const RemoveRolesHandler = require("./lib/handlers/RemoveRolesHandler");

// INITIAL USER
const createInitialUser = require("./lib/create-initial-user");

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

		// SERVICES
		const passwordService = new PasswordService(userRepo);
		const roleService = new RoleService();

		// CREATE
		const createUserHandler = new CreateUserHandler(userRepo, passwordService);
		await createInitialUser(db, createUserHandler);

		// READ
		const getUserHandler = new GetUserHandler(userRepo);
		const getUserByIdHandler = new GetUserByIdHandler(userRepo);
		const getScopesHandler = new GetScopesHandler(roleService);

		// UPDATE
		updateUser.init(database);
		updateUserHttp.init(updateUser);

		// DELETE
		deleteUser.init(database);
		deleteUserHttp.init(deleteUser);

		// PASSWORD
		const validatePasswordHandler = new ValidatePasswordHandler(userRepo, passwordService);
		const updatePasswordHandler = new UpdatePasswordHandler(userRepo, passwordService);
		setPassword.init(database);

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
		bus.subscribe(constants.endpoints.http.admin.DELETE_USER, deleteUserHttp.handle).permissions([constants.permissions.ADMIN_ANY]);


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
			subject: constants.endpoints.service.VERIFY_EMAIL,
			// docs: TODO:
			handle: (req) => verifyEmailAddressHandler.handle(req)
		});

		bus.subscribe({
			subject: constants.endpoints.service.RESEND_VERIFICATION_EMAIL,
			// docs: TODO:
			handle: (req) => resendVerificationEmailHandler.handle(req)
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
			subject: constants.endpoints.service.GET_SCOPES,
			// docs: TODO:
			handle: (req) => getScopesHandler.handle(req)
		});

		// UNREFACTORED SERVICE BELOW
		bus.subscribe(constants.endpoints.service.UPDATE_USER, updateUser.handle);
		bus.subscribe(constants.endpoints.service.DELETE_USER, deleteUser.handle);
		bus.subscribe(constants.endpoints.service.SET_PASSWORD, setPassword.handle);


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