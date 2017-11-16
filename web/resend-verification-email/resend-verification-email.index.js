const bus = require("fruster-bus");
const uuid = require("uuid");
const log = require("fruster-log");
const fs = require("fs");
const constants = require("../../lib/constants");


module.exports.get = async (req, res) => {

    fs.readFile("./web/resend-verification-email/index.html", {}, (err, data) => {
        if (err)
            throw err;
        else
            res.end(data);
    });

};

module.exports.post = async (req, res) => {

    console.log(req.body);

    try {
        const response = await bus.request(constants.endpoints.service.RESEND_VERIFICATION_EMAIL, {
            reqId: uuid.v4(),
            data: {
                email: req.body.email
            }
        });

        res.json(response);
        res.end();
    } catch (err) {
        res.status(err.status);
        res.json(err);
        res.end();
    }

};