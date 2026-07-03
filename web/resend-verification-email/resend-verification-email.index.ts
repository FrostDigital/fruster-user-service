import bus from "@fruster/bus";
import * as uuid from "uuid";
import * as fs from "fs";
import { Request, Response } from "express";
import constants from "../../lib/constants";


export const get = async (req: Request, res: Response) => {
	fs.readFile("./web/resend-verification-email/index.html", {}, (err, data) => {
		if (err)
			throw err;
		else
			res.end(data);
	});
};

export const post = async (req: Request, res: Response) => {
	try {
		const response = await bus.request({
			subject: constants.endpoints.service.RESEND_VERIFICATION_EMAIL,
			message: {
				reqId: uuid.v4(),
				data: {
					email: req.body.email
				}
			}
		} as any);

		res.json(response);
	} catch (err: any) {
		res.status(err.status || 500).json(err);
	}
};
