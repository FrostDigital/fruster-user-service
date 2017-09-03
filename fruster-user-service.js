const bus = require("fruster-bus");
const mongo = require("mongodb");
const conf = require("./config");
const constants = require('./lib/constants.js');

// CREATE
const createUser = require("./lib/create-user");

// READ
const getUser = require("./lib/get-user");
const getUsersHttp = require("./lib/http/get-users-http");
const getUserByIdHttp = require("./lib/http/get-user-by-id-http");
const getScopes = require("./lib/get-scopes");

// UPDATE
const updateUser = require("./lib/update-user");
const updateUserHttp = require("./lib/http/update-user-http");

// DELETE
const deleteUser = require("./lib/delete-user");
const deleteUserHttp = require("./lib/http/delete-user-http");

// PASSWORD
const validatePassword = require("./lib/validate-password");
const updatePassword = require("./lib/update-password");
const setPassword = require("./lib/set-password");

// ROLES
const addRoles = require("./lib/add-roles");
const removeRoles = require("./lib/remove-roles");

// INITIAL USER
const createInitialUser = require("./lib/create-initial-user");

// EMAIL VERIFICATION
const VerifyEmailAddressHandler = require('./lib/email-verification/VerifyEmailAddressHandler.js');
const ResendVerificationEmailHandler = require('./lib/email-verification/ResendVerificationEmailHandler.js');


module.exports = {

	start: async (busAddress, mongoUrl) => {

		await bus.connect(busAddress);
		const db = await mongo.connect(mongoUrl);
		await createInitialUser(db);
		const database = db.collection(conf.userCollection);
		createIndexes(db);

		//INITS//////////////////////////////////////////////////////////////////////////////////

		//CREATE
		createUser.init(database);

		//READ
		getUser.init(database);
		getUsersHttp.init(getUser);
		getUserByIdHttp.init(getUser);

		//UPDATE
		updateUser.init(database);
		updateUserHttp.init(updateUser);

		//DELETE
		deleteUser.init(database);
		deleteUserHttp.init(deleteUser);

		//PASSWORD
		validatePassword.init(database);
		updatePassword.init(database, validatePassword, getUser);
		setPassword.init(database);

		//ROLES
		addRoles.init(database);
		removeRoles.init(database);

		//EMAIL VERIFICATION
		const verifyEmailAddressHandler = new VerifyEmailAddressHandler(database, updateUser);
		const resendVerificationEmailHandler = new ResendVerificationEmailHandler(database);

		// ENDPOINTS ///////////////////////////////////////////////////////////////////////////////

		//HTTP
		bus.subscribe(constants.endpoints.http.admin.CREATE_USER, createUser.handle).permissions(["admin.*"]);
		bus.subscribe(constants.endpoints.http.admin.GET_USERS, getUsersHttp.handle).permissions(["admin.*"]);
		bus.subscribe(constants.endpoints.http.admin.GET_USER, getUserByIdHttp.handle).permissions(["admin.*"]);
		bus.subscribe(constants.endpoints.http.admin.UPDATE_USER, updateUserHttp.handle).permissions(["admin.*"]);
		bus.subscribe(constants.endpoints.http.admin.DELETE_USER, deleteUserHttp.handle).permissions(["admin.*"]);
		bus.subscribe(constants.endpoints.http.VERIFY_EMAIL, (req) => verifyEmailAddressHandler.handle(req));
		bus.subscribe(constants.endpoints.http.RESEND_VERIFICATION_EMAIL, (req) => resendVerificationEmailHandler.handle(req));

		//SERVICE
		bus.subscribe(constants.endpoints.service.CREATE_USER, createUser.handle);
		bus.subscribe(constants.endpoints.service.GET_USER, getUser.handle);
		bus.subscribe(constants.endpoints.service.UPDATE_USER, updateUser.handle);
		bus.subscribe(constants.endpoints.service.DELETE_USER, deleteUser.handle);
		bus.subscribe(constants.endpoints.service.VALIDATE_PASSWORD, validatePassword.handle);
		bus.subscribe(constants.endpoints.service.UPDATE_PASSWORD, updatePassword.handle);
		bus.subscribe(constants.endpoints.service.SET_PASSWORD, setPassword.handle);
		bus.subscribe(constants.endpoints.service.ADD_ROLES, addRoles.handle);
		bus.subscribe(constants.endpoints.service.REMOVE_ROLES, removeRoles.handle);
		bus.subscribe(constants.endpoints.service.GET_SCOPES, getScopes.handle);

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