const bus = require("fruster-bus");
const uuid = require("uuid");
const log = require("fruster-log");
const fs = require("fs");
const constants = require("../../lib/constants");
const config = require("../../config");


module.exports.get = async (req, res) => {

    fs.readFile("./web/verify-email/index.html", {}, (err, data) => {
        if (err)
            throw err;
        else
            res.end(data);
    });

};

module.exports.post = async (req, res) => {

    try {
        const response = await bus.request(constants.endpoints.service.VERIFY_EMAIL, {
            reqId: uuid.v4(),
            data: {
                tokenId: req.body.tokenId
            }
        });

        if (response.status === 200 && config.emailVerificationRedirectUrl) {
            response.data = {
                redirectTo: config.emailVerificationRedirectUrl
            };
        }

        res.json(response);
    } catch (err) {
        res.status(err.status).json(err);
    }

};