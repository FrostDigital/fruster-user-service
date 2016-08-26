/*jslint latedef:false, esversion:6*/

var crypto = require('crypto');
var bus = require('fruster-bus');
var uuid = require('uuid');
var secureRandom = require('csprng');

var passwordUtils = module.exports = {};

passwordUtils.hash = (id, password) => {
	let salt = generateSalt();
	let pepper = generatePepper(id, password);
	let hashValue = hashPassword(password, salt, pepper);

	return {
		hashedPassword: hashValue,
		salt: salt
	};
};

passwordUtils.validatePassword = (hashedPassword, salt, id, password) => {
	let pepper = generatePepper(id, password);
	let hashValue = hashPassword(password, salt, pepper);

	return hashValue === hashedPassword;
};

function generateSalt() {
	return secureRandom(256, 36);
}

function generatePepper(id, password) {
	return crypto.createHmac("sha256", id + password).digest("hex");
}

function hashPassword(password, salt, pepper) {
	let hashedPassword = crypto.createHmac("sha512", password + pepper).digest("hex");
	let hashValue = crypto.createHmac("sha512", salt + hashedPassword).digest("hex");

	return hashValue;
}