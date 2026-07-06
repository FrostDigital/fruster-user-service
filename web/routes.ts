import { Express } from "express";
import * as verifyEmail from "./verify-email/verify-email.index";
import * as setPassword from "./set-password/set-password.index";
import * as resendVerificationEmail from "./resend-verification-email/resend-verification-email.index";
import * as roleAdminWeb from "./role-admin-web/role-admin-web.index";
import config from "../config";


const routes = (app: Express) => {

	app.get("/verify-email", verifyEmail.get);

	app.get("/set-password", setPassword.get);
	app.post("/set-password", setPassword.post);

	app.get("/resend-verification", resendVerificationEmail.get);
	app.post("/resend-verification", resendVerificationEmail.post);

	if (config.useDbRolesAndScopes)
		if (!config.optOutOfRoleAdminWeb)
			app.get("/admin", roleAdminWeb.get);
};

export default routes;
