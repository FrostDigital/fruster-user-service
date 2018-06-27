const config = require("../../config.js");
const bus = require("fruster-bus");
const log = require("fruster-log");

class MailServiceClient {

    constructor() { }

    static get endpoints() {
        return {
            SEND: "mail-service.send"
        };
    }

    static get FROM() {
        return config.emailVerificationFrom;
    }

    /**
     * Sends an email with specified body and subject to specified email address.
     * 
     * @param {String} reqId 
     * @param {String} to 
     * @param {String} subject 
     * @param {Object} body 
     */
    static async send(reqId, to, subject, body) {
        const req = {
            reqId: reqId,
            data: {
                to: [to],
                from: MailServiceClient.FROM,
                subject: subject,
                message: body
            }
        };

        return await bus.request({
            subject: MailServiceClient.endpoints.SEND,
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
    static async sendWithTemplate(reqId, to, templateId, templateArgs) {
        log.debug("Sending email with template ", templateId, "to", to, "with templateArgs", templateArgs);

        const emailResp = await bus.request({
            skipOptionsRequest: true,
            subject: MailServiceClient.endpoints.SEND,
            message: {
                reqId,
                data: {
                    to: to instanceof Array ? to : [to],
                    from: MailServiceClient.FROM,
                    templateId,
                    templateArgs
                }
            }
        });

        log.debug("Successfully sent email with template ", templateId, "to", to);

        return emailResp.data;
    }

}

module.exports = MailServiceClient;