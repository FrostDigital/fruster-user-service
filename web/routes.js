const verifyEmail = require("./verify-email/verify-email.index");
const resendVerificationEmail = require("./resend-verification-email/resend-verification-email.index");


module.exports = (app) => {

    app.get("/verify-email", verifyEmail.get);

    app.get("/resend-verification", resendVerificationEmail.get);
    app.post("/resend-verification", resendVerificationEmail.post);

};