import UserRepo from "../repos/UserRepo";
import crypto from "crypto";
import secureRandom from "csprng";
import config from "../../config";
import deprecatedErrors from "../deprecatedErrors";
import UserModel from "../models/UserModel";

class PasswordManager {
	_repo: UserRepo;

	constructor(repo: UserRepo) {
		this._repo = repo;
	}

	async hashPassword(user: UserModel, newPassword?: string): Promise<UserModel> {
		const hashDate = new Date();
		const salt = this._generateSalt();
		const pepper = this._generatePepper(user.id, newPassword || user.password, hashDate);
		const hashValue = await this._hashPassword(newPassword || user.password, salt, pepper);

		user.password = hashValue;
		user.salt = salt;
		user.hashDate = hashDate;

		return user;
	}

	async hashPasswordForUserId(userId: string, password: string): Promise<{ password: string; salt: string; hashDate: Date }> {
		const hashDate = new Date();
		const salt = this._generateSalt();
		const pepper = this._generatePepper(userId, password, hashDate);
		const hashValue = await this._hashPassword(password, salt, pepper);

		return { password: hashValue, salt: salt, hashDate: hashDate };
	}

	async validatePassword(hashedPassword: string, salt: string, id: string, inputPassword: string, hashDate?: Date): Promise<boolean> {
		const pepper = this._generatePepper(id, inputPassword, hashDate);
		const hashValue = await this._hashPassword(inputPassword, salt, pepper);

		return hashValue === hashedPassword;
	}

	async validatePasswordForUser(inputPassword: string, userId: string): Promise<boolean> {
		const user = await this._repo.getById(userId);
		return await this.validatePassword((user as UserModel).password, (user as UserModel).salt, userId, inputPassword, (user as UserModel).hashDate);
	}

	validatePasswordFollowsRegExp(password: string): void {
		if (!(new RegExp(config.passwordValidationRegex).test(password)))
			throw deprecatedErrors.invalidPassword();
	}

	_generateSalt(): string {
		return secureRandom(256, 36);
	}

	_generatePepper(id: string, password: string, hashDate?: Date): string {
		if (!hashDate || hashDate < new Date("2017-06-26"))
			return crypto.createHmac("sha256", id + password).digest("hex");
		else
			return crypto.createHmac("sha512", id + password).digest("hex");
	}

	async _hashPassword(password: string, salt: string, pepper: string): Promise<string> {
		const hashedPassword = crypto.createHmac("sha512", password + pepper).digest("hex");
		let hashValue: string;

		if (config.hashingAlgorithm === "pbkdf2")
			hashValue = await this._pbkdf2(hashedPassword, salt);
		else
			hashValue = crypto.createHmac(config.hashingAlgorithm, salt + hashedPassword).digest("hex");

		return hashValue;
	}

	_pbkdf2(hashedPassword: string, salt: string): Promise<string> {
		return new Promise((resolve, reject) => {
			crypto.pbkdf2(hashedPassword, salt, 1000, 96, "sha512", (err, derivedKey) => {
				if (err) reject(err);
				else resolve(derivedKey.toString("base64"));
			});
		});
	}
}

export default PasswordManager;
