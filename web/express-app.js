const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const log = require("fruster-log");
const http = require("http");
const routes = require("./routes");

let server;

function createExpressApp() {
    let app = express();

    // Set default view engine even though markojs is used
    app.set("view engine", "pug");

    // Configure body parser
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
        extended: false
    }));

    // Set static site directory where javascript, (s)css, etc will reside
    app.use(express.static(path.join(__dirname, "static")));

    // Delegate to actual routing to pages/endpoints
    routes(app);

    // Error handling (must be after routing above)
    app.use(function (req, res, next) {
        const err = new Error("Not Found");
        err.status = 404;
        next(err);
    });

    app.use(function (err, req, res, next) {
        res.locals.message = err.message;
        res.locals.error = req.app.get("env") === "development" ? err : {};
        res.status(err.status || 500);
        res.json(err);
    });

    return app;
}


module.exports = {
    start: (port) => {
        let app = createExpressApp();

        app.set("port", port);

        server = http.createServer(app);

        server.listen(port);

        return new Promise((resolve, reject) => {
            server.on("error", (err) => {
                log.error("Failed starting http server", err);
                process.exit(1);
            });

            server.on("listening", () => {
                log.info(`HTTP server started and listening on port ${port}`);
                resolve(app);
            });
        });
    },

    stop: () => {
        server.close();
    }
};