const log = require("fruster-log");
const config = require("../../config");
const UserModel = require("../models/UserModel");
const EmailUtils = require("../utils/EmailUtils");
const MailServiceClient = require("../clients/MailServiceClient");

class EmailManager {

	/**
	 * @param {String} reqId
	 * @param {UserModel} user
	 */
	static async sendVerificationEmail(reqId, user, token) {
		log.debug("Preparing email verification details for user", user.id);

		if (config.emailVerificationTemplateByRole || config.emailVerificationTemplate) {
			let templateId = config.emailVerificationTemplate;

			if (config.emailVerificationTemplateByRole)
				templateId = EmailUtils.getEmailTemplate(user.roles);

			log.debug("Should send email verification mail using template to user", user.id);

			await MailServiceClient.sendMail({
				reqId,
				to: [user.email],
				from: config.emailVerificationFrom,
				templateId,
				templateArgs: {
					user: await user.toViewModel(),
					token
				}
			});
		} else {
			log.debug("Should send email verification mail using plain text to user", user.id);

			await MailServiceClient.sendMail({
				reqId,
				to: [user.email],
				from: config.emailVerificationFrom,
				subject: config.emailVerificationSubject,
				message: EmailUtils.getEmailMessage(user, token)
			});
		}

		log.debug("Successfully sent email verification mail to user", user.id);
	}

}

module.exports = EmailManager;
