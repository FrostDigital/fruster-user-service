module.exports = {

	/** Nats bus address to connect to */
	bus: process.env.BUS || "nats://localhost:4222",

	/** Url to database */
	mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/user-service",

	/** Predefined permissions for roles*/
	roles: process.env.ROLE_SCOPES || "super-admin:*;admin:profile.get,user.*;user:profile.get",

	/** Regex used for validating email adresses, defaults to checking letters & numbers, an @ and a top domain*/
	emailValidationRegex: process.env.EMAIL_VALIDATION_REGEX || /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.([a-z]{2,10})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i,

	/** Regex used for validating passwords, defaults to at least one uppercase letter, one lowercase letter and one digit, between 6 and 50 characters long*/
	passwordValidationRegex: process.env.PASSWORD_VALIDATION_REGEX || /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,100}$/,

	/** Regex used for validating ids in requests, checks for UUID v4 */
	idValidationRegex: process.env.ID_VALIDATION_REGEX || /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/,

	/** Unique indexes set in the database for users, sets id as default. Use `profile.` for profile indexes. eg: `profile.name` */
	uniqueIndexes: parseArray(process.env.UNIQUE_INDEXES) || [],

	/** The email of the initial account being created upon first run */
	initialUserEmail: process.env.INITIAL_USER_EMAIL || "admin@frost.se",

	/** The password of the initial account being created upon first run. Should be changed in prod! */
	initialUserPassword: process.env.INITIAL_USER_PASSWORD || "Frosties2019",

	/** The roles of the initial account being created upon first run */
	initialUserRole: process.env.INITIAL_USER_ROLE || "super-admin",

	/** Wether or not to require users to have a password. Typically used with some external login method such as BankID or facebook. */
	requirePassword: parseBool(process.env.REQUIRE_PASSWORD || "true"),

	/** Wether need send set password email */
	requireSendSetPasswordEmail: process.env.REQUIRE_SEND_SET_PASSWORD_EMAIL === "true",

	/** Wether or not to require the users to verify their email address before being able to signin.
		 If this is set to true a web server will run providing a simple request new token / verify frontend @ /resend-verification & /verify-email:tokenId */
	requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",

	/** Wether or not to ask the users to verify their email address but not requiring it to signin.
		 If this is set to true a web server will run providing a simple request new token / verify  frontend @ /resend-verification & /verify-email:tokenId */
	optionalEmailVerification: process.env.OPTIONAL_EMAIL_VERIFICATION === "true",

	/** The roles email verification applies to, if set to * it applies to all roles. */
	emailVerificationForRoles: parseArray(process.env.EMAIL_VERIFICATION_FOR_ROLES || "*"),

	/** HTTP port where email verification web will run */
	port: process.env.PORT || 3120,

	/** :user-{field}: can be used to display user information in the email. e.g. :user-firstName:
		 :token is the email verification token to be used to validate the email address. */
	emailVerificationMessage: process.env.EMAIL_VERIFICATION_MESSAGE || "Hello :user-firstName: :user-lastName:, \nVisit http://localhost:3120/verify-email?token=:token: to verify your email.",

	emailVerificationSubject: process.env.EMAIL_VERIFICATION_SUBJECT || "Verify email",

	emailVerificationFrom: process.env.EMAIL_VERIFICATION_FROM || "verification@fruster.se",

	/** Template to use for emails about verifying email. If not set, the standard inline email will be used. */
	emailVerificationTemplate: process.env.EMAIL_VERIFICATION_TEMPLATE || undefined,

	/**
	 * If need different email templates for different roles.
	 * Value should <role1>,<role2>:<templateId1>;<role3>,<role4>:<templateId2>
	 * Ex - "admin:939e8ab4-9aa7-4d33-96ec-09c41db82072;customer,consultant:898654d5-b07b-420b-99bc-ccaa133eb092"
	 */
	emailVerificationTemplateByRole: process.env.EMAIL_VERIFICATION_TEMPLATE_BY_ROLE || undefined,

	/**
	 * If set, after an email has been verified the web redirects to this url. The verified email, or error, will be added to the url as query params:
	 * Example w/ verified email http://flamingo.education  > http://flamingo.education/?verified={email}
	 * Example w/ error http://flamingo.education  > http://flamingo.education/?error={error} e.g. "INVALID_TOKEN"
	 */
	emailVerificationRedirectUrl: process.env.EMAIL_VERIFICATION_REDIRECT_URL || undefined,

	/** :user-{field}: can be used to display user information in the email. e.g. :user-firstName:
			 :token is the set password token to be used to set password. */
	setPasswordEmailMessage: process.env.SET_PASSWORD_EMAIL_MESSAGE || "Hello :user-firstName: :user-lastName:, \nVisit http://localhost:3120/set-password?token=:token: to set password.",

	setPasswordEmailSubject: process.env.SET_PASSWORD_EMAIL_SUBJECT || "Set password",

	setPasswordEmailFrom: process.env.SET_PASSWORD_EMAIL_FROM || "set_password@fruster.se",

	/** Template to use for emails about verifying email. If not set, the standard inline email will be used. */
	setPasswordEmailTemplate: process.env.SET_PASSWORD_EMAIL_TEMPLATE || undefined,

	/**
	 * If set, after set password the web redirects to this url. The set password, or error, will be added to the url as query params:
	 * Example w/ verified email http://flamingo.education  > http://flamingo.education/?verified={email}
	 * Example w/ error http://flamingo.education  > http://flamingo.education/?error={error} e.g. "INVALID_TOKEN"
	 */
	setPasswordEmailRedirectUrl: process.env.SET_PASSWORD_EMAIL_REDIRECT_URL || undefined,

	/** Will lowercase names (firstname, lastname and middle name) during create and update if set to true */
	lowerCaseName: process.env.LOWER_CASE_NAME === "true",

	/** If user service accepts queries for ALL users
		 This is disabled by default for security reasons. */
	allowGetAll: process.env.ALLOW_GET_ALL === "true",

	/** Database field used to validate password (e.g. login or updating password) with, can be CSV for multiple fields  */
	usernameValidationDbField: parseArray(process.env.USERNAME_VALIDATION_DB_FIELD || "email"),

	/** Skip email unique index if email not unique. */
	skipEmailUniqueIndex: process.env.SKIP_EMAIL_UNIQUE_INDEX === "true",

	/** Which hashing algorithm to use for hashing passwords, supports whatever cryptojs supports.
		 NOTE: changing this will make it impossible to login with any accounts created with another hashing teqnique prior. */
	hashingAlgorithm: process.env.HASHING_ALGORITHM || "sha512",

	/** Whether or not to use database for roles and scopes. This makes it possible to dynamically add new system roles and scopes.  */
	useDbRolesAndScopes: process.env.USE_DB_ROLES_AND_SCOPES === "true",

	/** Whether or not to opt out of the admin web for handling roles and scopes.  */
	optOutOfRoleAdminWeb: process.env.OPT_OUT_OF_ROLE_ADMIN_WEB === "true",

	/** Base URL to API (the api gateway) used by the frontend code served by the web server to make requests */
	apiRoot: process.env.API_ROOT || "http://localhost:3000",

	/** Whether or not to require password when updating email address */
	requirePasswordOnEmailUpdate: process.env.REQUIRE_PASSWORD_ON_EMAIL_UPDATE === "true",

	/** Whether or not to require a new user to have firstName and lastName */
	requireNames: parseBool(process.env.REQUIRE_NAMES || "true"),

	/**
	 * The fields to be saved in the user dataset. If `ALL` is defined in both userFields and profileFields; userFields is dominant.
	 * If only fields are defined in userFields; those fields are saved in the user dataset and the rest in the profile dataset.
	 * In order to split between user and profile dataset with only the required fields stored in the user dataset `REQUIRED_ONLY` can be used.
	 * See the required fields array in `constants.dataset.USER_REQUIRED_FIELDS`
	 */
	userFields: parseArray(process.env.USER_FIELDS || "ALL"),

	/**
	 * The fields to be saved in the user dataset. If `ALL` is defined in both userFields and profileFields; userFields is dominant.
	 * If only fields are defined in profileFields; those fields are saved in the user dataset and the rest in the profile dataset.
	 * Typically this doesn't need to be configured.
	 */
	profileFields: parseArray(process.env.PROFILE_FIELDS || "ALL"),

	/** Threshold for what is considered to be a slow query. If slow, this will be logged */
	slowQueryThresholdMs: Number.parseInt(process.env.SLOW_QUERY_THRESHOLD_MS || "250"),

	/** Properties should not expose to outside. These filed will remove from response, or will throw error if response has such field*/
	privateProperties: "password|salt|emailVerificationToken|hashDate" + (process.env.PRIVATE_PROPERTIES ? "|" + process.env.PRIVATE_PROPERTIES : ""),

	/** Whether or not to use the /me to be able to get the logged in user via a http endpoint */
	useMeEndpoint: parseBool(process.env.USE_ME_ENDPOINT || "false")

};

function parseArray(str) {
	if (str) return str.split(",");
	return null;
}

function parseBool(boolStr) {
	return boolStr == "true";
}
