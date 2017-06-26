const config = require('../../config.js');
const bus = require("fruster-bus");

const endpoints = {
    SEND: "mail-service.send"
};

class MailServiceClient {

    constructor() {
        this.from = config.emailValidationFrom;
    }

    async send(reqId, to, subject, body) {
        const req = {
            reqId: reqId,
            data: {
                to: [to],
                from: this.from,
                subject: subject,
                message: body
            }
        };

        return await bus.request(endpoints.SEND, req);
    }

}

module.exports = new MailServiceClient();