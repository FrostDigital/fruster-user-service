import log from "@fruster/log";
import config from "../../config";
import UserModel from "../models/UserModel";
import EmailUtils from "../utils/EmailUtils";
import MailServiceClient from "../clients/MailServiceClient";

class EmailManager {
	static async sendVerificationEmail(reqId: string | undefined, user: UserModel, token: string): Promise<void> {
		log.debug("Preparing email verification details for user", user.id);

		if (config.emailVerificationTemplateByRole || config.emailVerificationTemplate) {
			let templateId = config.emailVerificationTemplate;

			if (config.emailVerificationTemplateByRole)
				templateId = EmailUtils.getEmailTemplate(user.roles as string[]);

			log.debug("Should send email verification mail using template to user", user.id);

			await MailServiceClient.sendMail({
				reqId,
				to: [user.email as string],
				from: config.emailVerificationFrom,
				templateId,
				templateArgs: { user: await user.toViewModel(), token }
			});
		} else {
			log.debug("Should send email verification mail using plain text to user", user.id);

			await MailServiceClient.sendMail({
				reqId,
				to: [user.email as string],
				from: config.emailVerificationFrom,
				subject: config.emailVerificationSubject,
				message: EmailUtils.getEmailMessage(config.emailVerificationMessage, user, token)
			});
		}

		log.debug("Successfully sent email verification mail to user", user.id);
	}

	static async sendSetPasswordEmail(reqId: string | undefined, user: UserModel, token: string): Promise<void> {
		log.debug("Preparing set password email details for user", user.id);

		if (config.setPasswordEmailTemplate) {
			log.debug("Should send set password mail using template to user", user.id);

			await MailServiceClient.sendMail({
				reqId,
				to: [user.email as string],
				from: config.setPasswordEmailFrom,
				templateId: config.setPasswordEmailTemplate,
				templateArgs: { user: await user.toViewModel(), token }
			});
		} else {
			log.debug("Should send set password mail using plain text to user", user.id);

			await MailServiceClient.sendMail({
				reqId,
				to: [user.email as string],
				from: config.setPasswordEmailFrom,
				subject: config.setPasswordEmailSubject,
				message: EmailUtils.getEmailMessage(config.setPasswordEmailMessage, user, token)
			});
		}

		log.debug("Successfully sent set password mail to user", user.id);
	}
}

export default EmailManager;
