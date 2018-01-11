module.exports = {

	bus: process.env.BUS || "nats://localhost:4222",

	mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/user-service",

	/** Predefined permissions for roles*/
	roles: process.env.ROLE_SCOPES || "super-admin:*;admin:profile.get,user.*;user:profile.get",

	/** Regex used for validating email adresses, defaults to checking letters & numbers, an @ and a top domain*/
	emailValidationRegex: process.env.EMAIL_VALIDATION_REGEX || /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i,

	/** Regex used for validating passwords, defaults to at least one uppercase letter, one lowercase letter and one digit, between 6 and 50 characters long*/
	passwordValidationRegex: process.env.PASSWORD_VALIDATION_REGEX || /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,50}$/,

	/** Regex used for validating ids in requests, checks for UUID v4 */
	idValidationRegex: process.env.ID_VALIDATION_REGEX || /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/,

	uniqueIndexes: parseArray(process.env.UNIQUE_INDEXES) || [],

	initialUserEmail: "admin@frost.se",

	initialUserPassword: "FrusterR0ckS",

	initialUserRole: process.env.INITIAL_USER_ROLE || "super-admin",

	userCollection: "users",

	requirePassword: parseBool(process.env.REQUIRE_PASSWORD || "true"),

	/** Wether or not to require the users to verify their email address before being able to signin. If this is set to true a web server will run providing a simple request new token / verify frontend @ /resend-verification & /verify-email:tokenId */
	requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",

	/** HTTP port where email verification web will run */
	port: process.env.PORT || 3120,

	/** :user-{field}: can be used to display user information in the email. e.g. :user-firstName:
	     :token is the email verification token to be used to validate the email address. */
	emailVerificationMessage: process.env.EMAIL_VERIFICATION_MESSAGE || "Hello :user-firstName: :user-lastName:, \nVisit http://localhost:3120/verify-email?token=:token: to validate your email.",

	emailVerificationSubject: process.env.EMAIL_VERIFICATION_SUBJECT || "Verify email",

	emailVerificationFrom: process.env.EMAIL_VERIFICATION_FROM || "verification@fruster.se",

	/** Template to use for emails about verifying email. If not set, the standard inline email will be used. */
	emailVerificationEmailTempate: process.env.EMAIL_VERIFICATION_TEMPLATE || undefined,

	/** 
	 * If set, after an email has been verified the web redirects to this url. The verified email, or error, will be added to the url as query params: 
	 * Example w/ verified email http://flamingo.education  > http://flamingo.education/?verified={email}
	 * Example w/ error http://flamingo.education  > http://flamingo.education/?error={error} e.g. "INVALID_TOKEN"
	 */
	emailVerificationRedirectUrl: process.env.EMAIL_VERIFICATION_REDIRECT_URL || undefined,

	/** Will lowercase names (firstname, lastname and middle name) during create and update if set to true */
	lowerCaseName: process.env.LOWER_CASE_NAME === "true",

	/** If user service accepts queries for ALL users
	     This is disabled by default for security reasons. */
	allowGetAll: process.env.ALLOW_GET_ALL === "true",

	/** Database field used to validate password (e.g. login or updating password) with  */
	usernameValidationDbField: process.env.USERNAME_VALIDATION_DB_FIELD || "email",

	/** Which hashing algorithm to use for hashing passwords, supports whatever cryptojs supports. 
 * NOTE: changing this will make it impossible to login with any accounts created with another hashing teqnique prior. */
	hashingAlgorithm: process.env.HASHING_ALGORITHM || "sha512",

	/** TODO:  */
	useDbRolesAndScopes: process.env.USE_DB_ROLES_AND_SCOPES === "true",

	/** TODO:  */
	optOutOfRoleAdminWeb: process.env.OPT_OUT_OF_ROLE_ADMIN_WEB === "true"

};

function parseArray(str) {
	if (str) {
		return str.split(",");
	}

	return null;
}

function parseBool(boolStr) {
	return boolStr == "true";
}