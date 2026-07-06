import config from "../../config";
import UserModel from "../models/UserModel";

class Utils {
	static validateEmail(email: string): boolean {
		return new RegExp(config.emailValidationRegex).test(email);
	}

	static toTitleCase(string: string): string {
		if (string && string.length > 1)
			return string.substring(0, 1).toUpperCase() + string.substring(1);
		return string;
	}

	static userShouldVerifyEmail(user: UserModel): boolean {
		return !!((config.requireEmailVerification
			|| config.optionalEmailVerification)
			&&
			(config.emailVerificationForRoles.includes("*")
				|| user.roles.find((r: string) => config.emailVerificationForRoles.includes(r))));
	}
}

export default Utils;
