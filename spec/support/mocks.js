const uuid = require("uuid");
const frusterTestUtils = require("fruster-test-utils");
const constants = require("../../lib/constants.js");
const SpecUtils = require("./SpecUtils");
const MailServiceClient = require("../../lib/clients/MailServiceClient");

module.exports = {

	getUserObject: () => {
		return {
			"roles": ["admin"],
			"firstName": "Viktor",
			"middleName": "Ludvig",
			"lastName": "Söderström",
			"email": uuid.v4() + "@frostdigxital.se",
			"password": "Localhost:8080",
			"emailVerified": true
		};
	},

	getOldUserObject: () => {
		return {
			"email": "admin@frost.se",
			"password": "b7b5e35f85746c6f0266b8f4b725d0fc35bd594f1aa64c966bac6f9eff5de4f434188df944329ae2eb69448ff8a389719bc5771909f98b9a1de3d77d8fb88ddc",
			"firstName": "admin",
			"lastName": "nimda",
			"roles": [
				"super-admin"
			],
			"middleName": null,
			"id": "58b6fd6a-f651-4e8a-8297-acf5c0494a58",
			"salt": "o4oxemd7ybieolg12nk7woozll4fxpqnxqaqr6v9w1ntx4kg55"
		};
	},

	getUserWithUnverifiedEmailObject: () => {
		return {
			"roles": ["admin"],
			"firstName": "Pedro",
			"middleName": "Von",
			"lastName": "Damn",
			"email": uuid.v4() + "@frostdigxitalx.se",
			"password": "Localhost:8080",
			"emailVerified": false,
			"emailVerificationToken": "hello-token"
		};
	},

	createUser: async (userObj) => {
		return await SpecUtils.busRequest({
			subject: constants.endpoints.service.CREATE_USER,
			data: userObj
		});
	},

	mockMailService: () => {
		return frusterTestUtils.mockService({
			subject: MailServiceClient.endpoints.SEND_MAIL,
			response: { status: 200 }
		});
	}

}
