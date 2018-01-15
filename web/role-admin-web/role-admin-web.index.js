const bus = require("fruster-bus");
const uuid = require("uuid");
const log = require("fruster-log");
const fs = require("fs");
const constants = require("../../lib/constants");
const AuthServiceClient = require("../../lib/clients/AuthServiceClient");
const authServiceClient = new AuthServiceClient();


module.exports.get = async (req, res) => {

    fs.readFile("./web/role-admin-web/index.html", {}, (err, data) => {
        if (err)
            throw err;
        else {
            if (req.headers.cookie) {
                data += "<script>window.isLoggedIn = true;</script>";
            }
            res.end(data);
        }
    });
};