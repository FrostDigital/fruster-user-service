import { injectable, inject } from "@fruster/decorators";
import UserRepo from "../repos/UserRepo";
import InitialUserRepo from "../repos/InitialUserRepo";
import UserModel from "../models/UserModel";
import config from "../../config";
import PasswordManager from "../managers/PasswordManager";


/**
 * NOTE: Not wired via @subscribe -- this isn't a bus handler, it's
 * called directly once at service startup (see fruster-user-service.ts).
 * DI still uses @injectable/@inject, so injections() must be called
 * before this class is instantiated.
 */
@injectable()
class CreateInitialUserHandler {

	@inject()
	private userRepo!: UserRepo;

	@inject()
	private initialUserRepo!: InitialUserRepo;

	@inject()
	private passwordManager!: PasswordManager;

	async handle() {
		if (!(await this._checkIfInitialUserExists()))
			await this._createInitialUser();

		return {
			status: 200
		};
	}

	/**
	 * Checks if user exists in user database
	 * if not checks if any record exists in the initial user database.
	 * Returns whether any record was found or not.
	 */
	async _checkIfInitialUserExists(): Promise<boolean> {
		const user = await this.userRepo.getUserByQuery({ email: config.initialUserEmail });

		if (!user)
			return this.initialUserRepo.exists();

		return true;
	}

	/**
	 * Creates the actual user of the initial user as well
	 * as a record in the initial user database.
	 */
	async _createInitialUser(): Promise<void> {
		const user = this._getInitialUser();

		await this.passwordManager.hashPassword(user);
		await this.userRepo.saveUser(user);
		await this.initialUserRepo.saveInitialUser(user);
	}

	_getInitialUser(): UserModel {
		return new UserModel({
			email: config.initialUserEmail,
			password: config.initialUserPassword,
			firstName: "Admin",
			lastName: "Nimda",
			roles: [config.initialUserRole]
		});
	}

}

export default CreateInitialUserHandler;
