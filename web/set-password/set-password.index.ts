import bus from "@fruster/bus";
import * as uuid from "uuid";
import * as fs from "fs";
import { Request, Response } from "express";
import constants from "../../lib/constants";
import config from "../../config";

const { passwordValidationRegex } = config;

export const get = async (req: Request, res: Response) => {
	fs.readFile("./web/set-password/index.html", {}, (err, data) => {
		if (err)
			throw err;
		else
			res.end(data);
	});
};

export const post = async (req: Request, res: Response) => {
	if (!(new RegExp(passwordValidationRegex).test(req.body.newPassword))) {
		res.status(200).json({
			status: 400,
			error: `Password not matching with regex - ${passwordValidationRegex}`
		});
	} else {
		try {
			await bus.request({
				subject: constants.endpoints.service.SET_PASSWORD,
				message: {
					reqId: uuid.v4(),
					data: {
						token: req.body.token,
						newPassword: req.body.newPassword
					}
				}
			} as any);

			res.status(200).json({ status: 200 });
		} catch (err) {
			res.status(200).json({
				status: 500,
				error: "Something went wrong. Please try it again"
			});
		}
	}
};
