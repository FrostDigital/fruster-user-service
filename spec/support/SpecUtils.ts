import bus from "@fruster/bus";
import constants from "../../lib/constants";
import * as uuid from "uuid";
import config from "../../config";

const configBackup = Object.assign({}, config);

interface BusRequestOptions {
	subject?: string;
	reqId?: string;
	user?: Record<string, any>;
	params?: Record<string, any>;
	query?: Record<string, any>;
	data?: any;
}

class SpecUtils {

	static createUser(user: Record<string, unknown>) {
		return SpecUtils.busRequest(constants.endpoints.service.CREATE_USER, user);
	}

	/**
	 * Makes a bus request with the appropriate options for most tests.
	 */
	static async busRequest(options: string | BusRequestOptions, inputData?: any): Promise<any> {
		let subject: string | undefined;

		if (typeof options === "string") {
			subject = options;
			options = {};
		}

		options = options || {};

		if (!subject)
			subject = options.subject;

		const reqId = options.reqId || uuid.v4();
		const user = options.user;
		const params = options.params;
		const query = options.query;
		const data = inputData || options.data;
		const req: Record<string, any> = { subject, skipOptionsRequest: true, message: { reqId } };

		if (user)
			req.message.user = user;
		if (params)
			req.message.params = params;
		if (query)
			req.message.query = query;
		if (data)
			req.message.data = data;

		return await bus.request(req as any);
	}

	static busRequestExpectError(options: string | BusRequestOptions, inputData?: any) {
		return SpecUtils.busRequest(options, inputData)
			.then(() => fail())
			.catch(err => {
				expect(err).toBeDefined();
				return err;
			});
	}

	static resetConfig() {
		Object.keys(configBackup)
			.forEach(conf => (config as Record<string, any>)[conf] = (configBackup as Record<string, any>)[conf]);
	}

	static delay(milliseconds: number) {
		return new Promise<void>(resolve => {
			setTimeout(() => { resolve(); }, milliseconds);
		});
	}

}

export default SpecUtils;
