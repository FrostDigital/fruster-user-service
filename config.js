module.exports = {

	bus: parseArray(process.env.BUS) || ['nats://localhost:4222'],

	mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017/user-service",

	// Predefined permissions for roles
	roles: process.env.ROLE_SCOPES || "super-admin:*;admin:profile.get,user.*;user:profile.get",

	// Regex used for validating email adresses, defaults to checking letters & numbers, an @ and a top domain
	emailValidationRegex: process.env.EMAIL_VALIDATION_REGEX || /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i,

	// Regex used for validating passwords, defaults to at least one uppercase letter, one lowercase letter and one digit, between 6 and 50 characters long
	passwordValidationRegex: process.env.PASSWORD_VALIDATION_REGEX || /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,50}$/,

	// Regex used for validating ids in requests, checks for UUID v4
	idValidationRegex: process.env.ID_VALIDATION_REGEX || /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/,

	initialUserEmail: "admin@frost.se",

	initialUserPassword: "FrusterR0ckS",

	initialUserRole: process.env.INITIAL_USER_ROLE || "super-admin",

	userCollection: "users",

	requirePassword: parseBool(process.env.REQUIRE_PASSWORD || "true"),

	requireEmailVerification: parseBool(process.env.REQUIRE_EMAIL_VERIFICATION || "false"),

	// :user-{field}: can be used to display user information in the email. e.g. :user-firstName:
	// :token is the email verification token to be used to validate the email address. 
	emailVerificationMessage: process.env.EMAIL_VERIFICATION_MESSAGE || "Hello :user-firstName: :user-lastName:, \nVisit http://deis.c1.fruster.se/validate-email?token=:token: to validate your email.",

	emailVerificationSubject: process.env.EMAIL_VERIFICATION_SUBJECT || "Validate email",

	emailVerificationFrom: process.env.EMAIL_VERIFICATION_FROM || "verification@fruster.se"
};

function parseArray(str) {
	if (str) {
		return str.split(',');
	}

	return null;
}

function parseBool(boolStr) {
	return boolStr == "true";
}