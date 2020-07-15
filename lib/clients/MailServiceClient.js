const bus = require("fruster-bus");

/**
 * Note: this service client was generated automatically by api doc @ 2020-07-14T10:14:04.390Z
 */
class MailServiceClient {

	/**
	 * All endpoints
	 */
	static get endpoints() {

		return {

			SEND_MAIL: "mail-service.send-mail"

		};

	}


	/**
	 * Sends a mail to one or more mails (emails) addresses via sendgrid
	 *
	 * @param {Object} param0
	 * @param {String} param0.reqId the request id
	 * @param {String|Array} param0.to Email or emails to send mail to
	 * @param {String=} param0.from Email address to send mail from
	 * @param {String=} param0.subject Required if `templateId` is not used! The subject of the mail being sent
	 * @param {String=} param0.message Required if `templateId` is not used! The mail body being sent
	 * @param {String=} param0.templateId Required if `message` is not used! An optional id of a sendgrid template to use. If this is used, the message field is ignored.
	 * @param {Object=} param0.templateArgs Arguments for the template. Uses `--` to replace arguments in template body. E.g. `-firstName-` in message body is replaced by the value of `templateArgs.firstName`
	 *
	 * @return {Promise<Void>}
	 */
	static async sendMail({ reqId, to, from, subject, message, templateId, templateArgs }) {
		return (await bus.request({
			subject: MailServiceClient.endpoints.SEND_MAIL,
			message: {
				reqId,
				data: {
					to, from, subject, message, templateId, templateArgs
				}
			}
		})).data;
	}

}

module.exports = MailServiceClient;
