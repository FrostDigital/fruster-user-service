const bus = require("fruster-bus");
const uuid = require("uuid");
const fs = require("fs");
const constants = require("../../lib/constants");
const { passwordValidationRegex } = require("../../config");

module.exports.get = async (req, res) => {
	fs.readFile("./web/set-password/index.html", {}, (err, data) => {
		if (err)
			throw err;
		else
			res.end(data);
	});
};

module.exports.post = async (req, res) => {
	if (!(new RegExp(passwordValidationRegex).test(req.body.newPassword))) {
		res.status(200).json({
			status: 400,
			error: `Password not matching with regex - ${passwordValidationRegex}`
		});
	} else {
		try {
			await bus.request(constants.endpoints.service.SET_PASSWORD, {
				reqId: uuid.v4(),
				data: {
					token: req.body.token,
					newPassword: req.body.newPassword
				}
			});

			res.status(200).json({ status: 200 });
		} catch (err) {
			res.status(200).json({
				status: 500,
				error: "Something went wrong. Please try it again"
			});
		}
	}
};
