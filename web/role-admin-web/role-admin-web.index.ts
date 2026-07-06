import * as fs from "fs";
import { Request, Response } from "express";


export const get = async (req: Request, res: Response) => {

	fs.readFile("./web/role-admin-web/index.html", {}, (err, data) => {
		if (err)
			throw err;
		else {
			let html = data.toString();

			if (req.headers.cookie)
				html += "<script>window.isLoggedIn = true;</script>";

			res.end(html);
		}
	});
};
