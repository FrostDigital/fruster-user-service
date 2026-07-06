import bus from "@fruster/bus";

class MailServiceClient {
	static get endpoints() {
		return { SEND_MAIL: "mail-service.send-mail" };
	}

	static async sendMail({ reqId, to, from, subject, message, templateId, templateArgs }: {
		reqId?: string;
		to: string[];
		from: string;
		subject?: string;
		message?: string;
		templateId?: string;
		templateArgs?: Record<string, unknown>;
	}) {
		return (await bus.request({
			subject: MailServiceClient.endpoints.SEND_MAIL,
			message: { reqId, data: { to, from, subject, message, templateId, templateArgs } }
		})).data;
	}
}

export default MailServiceClient;
