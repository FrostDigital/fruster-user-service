import bus from "@fruster/bus";
import * as uuid from "uuid";
import * as fs from "fs";
import { Request, Response } from "express";
import constants from "../../lib/constants";
import config from "../../config";


export const get = async (req: Request, res: Response) => {
	try {
		const verificationResponse = await verifyToken(req.query.token as string);

		if (config.emailVerificationRedirectUrl)
			res.redirect(`${config.emailVerificationRedirectUrl}?verified=${verificationResponse.data.verifiedEmail}`);
		else {
			const html = await getHtml("./web/verify-email/success.html");
			res.end(html);
		}
	} catch (err: any) {
		if (config.emailVerificationRedirectUrl)
			res.redirect(`${config.emailVerificationRedirectUrl}?error=${err.error.code.split(".")[1]}`);
		else {
			const html = await getHtml("./web/verify-email/error.html");
			res.end(html);
		}
	}
};

function getHtml(filePath: string): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, {}, (err, data) => {
			if (err)
				reject(err);
			else
				resolve(data);
		});
	});
}

async function verifyToken(token: string) {
	return await bus.request({
		subject: constants.endpoints.service.VERIFY_EMAIL,
		message: {
			reqId: uuid.v4(),
			data: {
				tokenId: token
			}
		}
	} as any);
}
