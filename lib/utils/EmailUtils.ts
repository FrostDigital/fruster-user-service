import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import secureRandom from "csprng";
import config from "../../config";
import errors from "../errors";
import UserModel from "../models/UserModel";

class EmailUtils {
	static generateToken(email: string): string {
		return crypto.createHmac("sha256", secureRandom(256, 36) + uuidv4() + email).digest("hex");
	}

	static getHashedToken(token: string): string {
		return crypto.createHmac("sha256", token).digest("hex");
	}

	static getEmailMessage(message: string, user: Record<string, any>, token: string): string {
		message = EmailUtils._replaceAll(message, ":token:", token);

		Object.keys(user).forEach(key => {
			if (message.includes(key)) {
				let val = user[key];

				switch (key) {
					case "firstName":
					case "middleName":
					case "lastName": val = val.substring(0, 1).toUpperCase() + user[key].substring(1);
				}

				message = EmailUtils._replaceAll(message, `:user-${key}:`, val);
			}
		});

		return message;
	}

	static getEmailTemplate(roles: string[]): string {
		if (!roles)
			throw errors.internalServerError("Role not found for generating verification email by template");

		for (const row of config.emailVerificationTemplateByRole.split(";")) {
			const [rolesCSV, templateId] = row.split(":");

			for (const role of roles)
				if (rolesCSV.split(",").includes(role))
					return templateId;
		}

		throw errors.internalServerError(`Cannot found template for - ${JSON.stringify(roles)}`);
	}

	static _replaceAll(string: string, search: string, replacement: string): string {
		return string.replace(new RegExp(search, "g"), replacement);
	}
}

export default EmailUtils;
