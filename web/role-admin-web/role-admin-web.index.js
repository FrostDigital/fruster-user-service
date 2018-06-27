const fs = require("fs");


module.exports.get = async (req, res) => {

    fs.readFile("./web/role-admin-web/index.html", {}, (err, data) => {
        if (err)
            throw err;
        else {
            if (req.headers.cookie)
                // @ts-ignore
                data += "<script>window.isLoggedIn = true;</script>";

            res.end(data);
        }
    });
};