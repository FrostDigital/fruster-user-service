const config = require("../../config.js");
const bus = require("fruster-bus");


class AuthServiceClient {

    constructor() {
        this.endpoints = {
            DECODE_TOKEN: "auth-service.decode-token"
        };
    }

    /**   
     * @param {String} reqId 
     * @param {String} token 
     */
    async decodeToken(reqId, token) {
        const req = {
            reqId: reqId,
            data: {
                token
            }
        };

        return await bus.request({
            subject: this.endpoints.DECODE_TOKEN,
            skipOptionsRequest: true,
            message: req
        });
    }
}

module.exports = AuthServiceClient;