import UserRepo from "./lib/repos/UserRepo";
import ProfileRepo from "./lib/repos/ProfileRepo";
import InitialUserRepo from "./lib/repos/InitialUserRepo";
import RoleScopesDbRepo from "./lib/repos/RoleScopesDbRepo";
import RoleScopesConfigRepo from "./lib/repos/RoleScopesConfigRepo";

import PasswordManager from "./lib/managers/PasswordManager";
import RoleManager from "./lib/managers/RoleManager";
import ProfileManager from "./lib/managers/ProfileManager";
import UserManager from "./lib/managers/UserManager";

import CreateInitialUserHandler from "./lib/handlers/CreateInitialUserHandler";
import CreateUserHandler from "./lib/handlers/CreateUserHandler";
import GetUserHandler from "./lib/handlers/GetUserHandler"; /** DEPRECATED */
import GetUsersByQueryHandler from "./lib/handlers/GetUsersByQueryHandler";
import GetUsersByAggregateHandler from "./lib/handlers/GetUsersByAggregateHandler";
import GetByAggregateHandler from "./lib/handlers/GetByAggregateHandler";
import GetUserByIdHandler from "./lib/handlers/GetUserByIdHandler";
import GetScopesForRolesHandler from "./lib/handlers/GetScopesForRolesHandler";
import UpdateUserHandler from "./lib/handlers/UpdateUserHandler";
import DeleteUserHandler from "./lib/handlers/DeleteUserHandler";
import DeleteUsersByQueryHandler from "./lib/handlers/DeleteUsersByQueryHandler";
import ValidatePasswordHandler from "./lib/handlers/ValidatePasswordHandler";
import UpdatePasswordHandler from "./lib/handlers/UpdatePasswordHandler";
import SetPasswordHandler from "./lib/handlers/SetPasswordHandler";
import AddRolesHandler from "./lib/handlers/AddRolesHandler";
import RemoveRolesHandler from "./lib/handlers/RemoveRolesHandler";
import VerifyEmailAddressHandler from "./lib/handlers/email-verification/VerifyEmailAddressHandler";
import ResendVerificationEmailHandler from "./lib/handlers/email-verification/ResendVerificationEmailHandler";
import AddSystemRoleHandler from "./lib/handlers/system/AddSystemRoleHandler";
import AddSystemRoleScopesHandler from "./lib/handlers/system/AddSystemRoleScopesHandler";
import GetSystemRolesHandler from "./lib/handlers/system/GetSystemRolesHandler";
import RemoveSystemRoleHandler from "./lib/handlers/system/RemoveSystemRoleHandler";
import RemoveSystemRoleScopesHandler from "./lib/handlers/system/RemoveSystemRoleScopesHandler";

import GetProfilesByQueryHandler from "./lib/handlers/GetProfilesByQueryHandler";
import UpdateProfileHandler from "./lib/handlers/UpdateProfileHandler";

import GetMeHandler from "./lib/handlers/GetMeHandler";

import "./lib/errors";

import { injections } from "@fruster/decorators";
import bus from "@fruster/bus";
import * as mongo from "mongodb";
import { Db } from "mongodb";
import config from "./config";
import constants from "./lib/constants";
import * as expressApp from "./web/express-app";
import docs from "./lib/docs";
import log from "@fruster/log";

const start = async (busAddress: string, mongoUrl: string): Promise<void> => {
	const client = new mongo.MongoClient(mongoUrl);
	await client.connect();
	const db = client.db();

	await bus.connect(busAddress);

	if (!process.env.CI) {
		try {
			await createIndexes(db);
		} catch (err) {
			log.warn("Error while creating indexes", err);
		}
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

	// Registers instances for @inject() properties on @injectable() handlers
	injections({ userRepo, profileRepo, initialUserRepo, passwordManager, roleManager, profileManager, userManager });

	// HANDLERS
	const createInitialUserHandler = new CreateInitialUserHandler();

	if (!process.env.CI) {
		await createInitialUserHandler.handle();
	}

	// createUserHandler is wired manually below (config-conditional schemas, see class-level note)
	const createUserHandler = new CreateUserHandler();

	// @subscribe auto-registers each of these on instantiation
	new GetScopesForRolesHandler();
	new GetUserHandler(); /** DEPRECATED */
	new GetUsersByQueryHandler();
	new GetUsersByAggregateHandler();
	new GetByAggregateHandler();
	new GetUserByIdHandler();
	new UpdateUserHandler();
	new DeleteUserHandler();
	new DeleteUsersByQueryHandler();
	new ValidatePasswordHandler();
	new UpdatePasswordHandler();
	new SetPasswordHandler();
	new AddRolesHandler();
	new RemoveRolesHandler();
	new VerifyEmailAddressHandler();
	new ResendVerificationEmailHandler();

	// Only registered (via @subscribe on instantiation) when profile-splitting is configured
	if (!(config.profileFields.includes(constants.dataset.ALL_FIELDS) && config.userFields.includes(constants.dataset.ALL_FIELDS))) {
		new GetProfilesByQueryHandler();
		new UpdateProfileHandler();
	}

	// Only registered (via @subscribe on instantiation) when the /me endpoint is enabled
	if (config.useMeEndpoint) {
		new GetMeHandler();
	}

	// ROLES & SCOPES, if configured
	if (config.useDbRolesAndScopes) {
		await roleScopesDbRepo.prepareRoles();

		// Registers roleScopesDbRepo for @inject() on the system role handlers below
		injections({ roleScopesDbRepo });

		// SYSTEM ROLES -- @subscribe auto-registers each on instantiation
		new AddSystemRoleHandler();
		new AddSystemRoleScopesHandler();
		new GetSystemRolesHandler();
		new RemoveSystemRoleHandler();
		new RemoveSystemRoleScopesHandler();
	}

	// HTTP
	bus.subscribe({
		subject: constants.endpoints.http.admin.CREATE_USER,
		requestSchema: constants.schemas.request.CREATE_USER_REQUEST,
		responseSchema: constants.schemas.response.USER_RESPONSE,
		permissions: [constants.permissions.ADMIN_ANY],
		mustBeLoggedIn: true,
		docs: docs.http.admin.CREATE_USER,
		handle: (req: any) => createUserHandler.handle(req)
	});

	// SERVICE
	bus.subscribe({
		subject: constants.endpoints.service.CREATE_USER,
		requestSchema: constants.schemas.request.CREATE_USER_SERVICE_REQUEST,
		responseSchema: constants.schemas.response.USER_RESPONSE,
		docs: docs.service.CREATE_USER,
		handle: (req: any) => createUserHandler.handle(req)
	});

	if (!busAddress.includes("mock") && (
		config.requireEmailVerification ||
		config.useDbRolesAndScopes ||
		config.optionalEmailVerification ||
		config.requireSendSetPasswordEmail
	))
		expressApp.start(config.port);
};

const stop = (): void => {
	if (config.requireEmailVerification ||
		config.optionalEmailVerification ||
		config.useDbRolesAndScopes ||
		config.requireSendSetPasswordEmail
	)
		expressApp.stop();
};

async function createIndexes(db: Db): Promise<Db> {
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

	config.uniqueIndexes.forEach(async (index: string) => {
		const indexObj: Record<string, number> = {};
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

export { start, stop, createIndexes };
