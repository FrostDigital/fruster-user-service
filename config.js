/*jslint latedef:false*/

module.exports = {

	bus: parseArray(process.env.BUS) || ['nats://localhost:4222'],

	mongoUrl: process.env.MONGO_URL || "mongodb://localhost:27017",

	//Predefined permissions for roles
	roles: process.env.ROLE_SCOPES || "admin:profile.get,user.*;user:profile.get",

	//Regex used for validating email adresses, defaults to checking letters & numbers, an @ and a top domain
	emailValidationRegex: process.env.EMAIL_VALIDATION_REGEX || /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i,

	//Regex used for validating passwords, defaults to at least one uppercase letter, one lowercase letter and one digit, between 6 and 50 characters long
	passwordValidationRegex: process.env.PASSWORD_VALIDATION_REGEX || /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,50}$/

};

function parseArray(str) {
	if (str) {
		return str.split(',');
	}

	return null;
}