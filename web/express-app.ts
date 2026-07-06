import express, { Express, NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import * as path from "path";
import log from "@fruster/log";
import * as http from "http";
import routes from "./routes";
import cookieParser from "cookie-parser";
import apiProxy from "./middleware/api-proxy";


let server: http.Server;

function createExpressApp(): Express {
	const app = express();

	app.use("/api", apiProxy());

	// Configure body parser
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: false
	}));

	// Enable cookie parsing
	app.use(cookieParser());

	// Set static site directory where javascript, (s)css, etc will reside
	app.use(express.static(path.join(__dirname, "static")));

	// Delegate to actual routing to pages/endpoints
	routes(app);

	// Error handling (must be after routing above)
	app.use((req: Request, res: Response, next: NextFunction) => {
		const err: any = new Error("Not Found");
		err.status = 404;
		next(err);
	});

	app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
		res.locals.message = err.message;
		res.locals.error = req.app.get("env") === "development" ? err : {};
		res.status(err.status || 500);
		res.json(err);
	});

	return app;
}

export const start = (port: number): Promise<Express> => {
	const app = createExpressApp();

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
};

export const stop = () => {
	if (server)
		server.close();
};
