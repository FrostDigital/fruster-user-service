import conf from "../../config";
import { createProxyMiddleware } from "http-proxy-middleware";

const apiProxy = () => createProxyMiddleware({
	target: conf.apiRoot,
	changeOrigin: true,
	on: {
		proxyRes: (proxyRes, req) => {
			proxyRes.headers["access-control-allow-origin"] = `http://${req.headers.origin}`;
		}
	}
});

export default apiProxy;
