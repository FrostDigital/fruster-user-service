const verifyEmail = require("./verify-email/verify-email.index");
const resendVerificationEmail = require("./resend-verification-email/resend-verification-email.index");
const roleAdminWeb = require("./role-admin-web/role-admin-web.index");


module.exports = (app) => {

    console.log("\n");
    console.log("=======================================");
    console.log("WTF");
    console.log("=======================================");
    console.log("\n");

    app.get("/verify-email", verifyEmail.get);

    app.get("/resend-verification", resendVerificationEmail.get);
    app.post("/resend-verification", resendVerificationEmail.post);

    app.get("/admin", roleAdminWeb.get);

};