const conf = require("../../config");
const request = require("request");

module.exports = () => apiProxyMiddleware;

/**
 * Middleware that proxies requests to the api gateway.
 * API gateway can still be used directly but this is to 
 * avoid CORS issues, specially during development. 
 */
function apiProxyMiddleware(req, res, next) {
    req.pipe(request(getApiGatewayUrl(req)))
        .on("response", (res) => setAllowOriginHeader(res, req.headers.origin))
        .pipe(res);
}

function getApiGatewayUrl(req) {
    return conf.apiRoot + req.url;
}

function setAllowOriginHeader(res, origin) {
    res.headers["access-control-allow-origin"] = `http://${origin}`;
}