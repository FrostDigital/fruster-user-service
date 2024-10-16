const verifyEmail = require("./verify-email/verify-email.index");
const setPassword = require("./set-password/set-password.index");
const resendVerificationEmail = require("./resend-verification-email/resend-verification-email.index");
const roleAdminWeb = require("./role-admin-web/role-admin-web.index");
const config = require("../config");


module.exports = (app) => {

	app.get("/verify-email", verifyEmail.get);

	app.get("/set-password", setPassword.get);
	app.post("/set-password", setPassword.post);

	app.get("/resend-verification", resendVerificationEmail.get);
	app.post("/resend-verification", resendVerificationEmail.post);

	if (config.useDbRolesAndScopes)
		if (!config.optOutOfRoleAdminWeb)
			app.get("/admin", roleAdminWeb.get);
};
