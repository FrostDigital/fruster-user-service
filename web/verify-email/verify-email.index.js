const bus = require("fruster-bus");
const uuid = require("uuid");
const log = require("fruster-log");
const fs = require("fs");
const constants = require("../../lib/constants");
const config = require("../../config");


/**
 * @param {Object} req 
 * @param {Object} res 
 */
module.exports.get = async (req, res) => {
    try {
        const verificationResponse = await verifyToken(req.query.token);

        if (config.emailVerificationRedirectUrl) {
            res.redirect(`${config.emailVerificationRedirectUrl}?verified=${verificationResponse.data.verifiedEmail}`);
        } else {
            const html = await getHtml("./web/verify-email/success.html");
            res.end(html);
        }
    } catch (err) {
        if (config.emailVerificationRedirectUrl) {
            res.redirect(`${config.emailVerificationRedirectUrl}?error=${err.error.code.split(".")[1]}`);
        } else {
            const html = await getHtml("./web/verify-email/error.html");
            res.end(html);
        }
    }
};

/**
 * @param {String} filePath 
 */
function getHtml(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, {}, (err, data) => {
            if (err)
                reject(err);
            else
                resolve(data);
        });
    });
}

/**
 * @param {String} token 
 */
async function verifyToken(token) {
    try {
        const response = await bus.request(constants.endpoints.service.VERIFY_EMAIL, {
            reqId: uuid.v4(),
            data: {
                tokenId: token
            }
        });

        return response;
    } catch (err) {
        throw err;
    }
}
