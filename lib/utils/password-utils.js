const crypto = require('crypto');
const bus = require('fruster-bus');
const uuid = require('uuid');
const secureRandom = require('csprng');
const config = require("../../config");
const utils = require("./utils");


function hash(id, password) {
	const hashDate = new Date();
	const salt = generateSalt();
	const pepper = generatePepper(id, password, hashDate);
	const hashValue = hashPassword(password, salt, pepper);

	return {
		hashedPassword: hashValue,
		salt: salt,
		/** If we want to change hash algorithm in the future we have to know when a password was hashed to determine what method to use when validating password. **/
		hashDate: hashDate
	};
}

function validatePassword(hashedPassword, salt, id, password, hashDate) {
	const pepper = generatePepper(id, password, hashDate);
	const hashValue = hashPassword(password, salt, pepper);
	return hashValue === hashedPassword;
}

function validatePasswordFollowsRegExp(password) {
	if (!(new RegExp(config.passwordValidationRegex).test(password)))
		throw utils.errors.invalidPassword();
}

function generateSalt() {
	return secureRandom(256, 36);
}

function generatePepper(id, password, hashDate) {
	if (!hashDate || hashDate < new Date("2017-06-26")) {
		return crypto.createHmac("sha256", id + password).digest("hex");
	} else {
		return crypto.createHmac("sha512", id + password).digest("hex");
	}
}

function hashPassword(password, salt, pepper) {
	const hashedPassword = crypto.createHmac("sha512", password + pepper).digest("hex");
	const hashValue = crypto.createHmac("sha512", salt + hashedPassword).digest("hex");

	return hashValue;
}

module.exports = {
	hash,
	validatePassword, validatePasswordFollowsRegExp
};