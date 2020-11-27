const log = require("fruster-log");
const config = require("../../config");
const UserModel = require("../models/UserModel");
const EmailUtils = require("../utils/EmailUtils");
const MailServiceClient = require("../clients/MailServiceClient");

class EmailManager {

	/**
	 * Send verification email
	 *
	 * @param {String} reqId
	 * @param {UserModel} user
	 * @param {String} token
	 */
	static async sendVerificationEmail(reqId, user, token) {
		log.debug("Preparing email verification details for user", user.id);

		if (config.emailVerificationTemplateByRole || config.emailVerificationTemplate) {
			let templateId = config.emailVerificationTemplate;

			if (config.emailVerificationTemplateByRole)
				templateId = EmailUtils.getEmailTemplate(config.emailVerificationTemplateByRole, user.roles);

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
				message: EmailUtils.getEmailMessage(config.emailVerificationMessage, user, token)
			});
		}

		log.debug("Successfully sent email verification mail to user", user.id);
	}

	/**
	 * Set password email
	 *
	 * @param {String} reqId
	 * @param {UserModel} user
	 * @param {String} token
	 */
	static async sendSetPasswordEmail(reqId, user, token) {
		log.debug("Preparing set password email details for user", user.id);

		if (config.setPasswordEmailTemplateByRole || config.setPasswordEmailTemplate) {
			let templateId = config.setPasswordEmailTemplate;

			if (config.setPasswordEmailTemplateByRole)
				templateId = EmailUtils.getEmailTemplate(config.setPasswordEmailTemplateByRole, user.roles);

			log.debug("Should send set password mail using template to user", user.id);

			await MailServiceClient.sendMail({
				reqId,
				to: [user.email],
				from: config.setPasswordEmailFrom,
				templateId,
				templateArgs: {
					user: await user.toViewModel(),
					token
				}
			});
		} else {
			log.debug("Should send set password mail using plain text to user", user.id);

			await MailServiceClient.sendMail({
				reqId,
				to: [user.email],
				from: config.setPasswordEmailFrom,
				subject: config.setPasswordEmailSubject,
				message: EmailUtils.getEmailMessage(config.setPasswordEmailMessage, user, token)
			});
		}

		log.debug("Successfully sent set password mail to user", user.id);
	}

}

module.exports = EmailManager;
