const config = require("../../config.js");
const bus = require("fruster-bus");


class MailServiceClient {

    constructor() {
        this.from = config.emailVerificationFrom;

        this.endpoints = {
            SEND: "mail-service.send"
        };
    }

    /**
     * Sends an email with specified body and subject to specified email address.
     * 
     * @param {String} reqId 
     * @param {String} to 
     * @param {String} subject 
     * @param {Object} body 
     */
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

        return await bus.request({
            subject: this.endpoints.SEND,
            skipOptionsRequest: true,
            message: req
        });
    }

    /**
     * Send mail to email using templateId.
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

module.exports = MailServiceClient;