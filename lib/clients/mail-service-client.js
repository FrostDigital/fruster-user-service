const config = require('../../config.js');
const bus = require("fruster-bus");


class MailServiceClient {

    constructor() {
        this.from = config.emailVerificationFrom;

        this.endpoints = {
            SEND: "mail-service.send"
        };
    }

    async send(reqId, to, subject, body) {
        const req = {
            reqId: reqId,
            skipOptionsRequest: true,
            data: {
                to: [to],
                from: this.from,
                subject: subject,
                message: body
            }
        };

        return await bus.request(this.endpoints.SEND, req);
    }

    /**
     * Send mail to email
     * 
     * @param {String} reqId request id
     * @param {String|Array<String>} to email address to send to
     * @param {String} templateId sendgrid template id
     * @param {Object} templateArgs template arguments / data
     */
    async sendWithTemplate(reqId, to, templateId, templateArgs) {
        return (await bus.request({
            skipOptionsRequest: true,
            subject: this.endpoints.SEND,
            message: {
                reqId,
                data: {
                    to: to instanceof Array ? to : [to],
                    from: this.from,
                    templateId,
                    templateArgs
                }
            }
        })).data;
    }

}

module.exports = new MailServiceClient();