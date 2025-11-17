import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

// Node backend
app.use(
  "/api/node",
  createProxyMiddleware({
    target: "http://localhost:5000",
    changeOrigin: true,
    pathRewrite: { "^/api/node": "/api" },
  })
);

// Python backend - SỬA PATH REWRITE
app.use(
  "/api/python",
  createProxyMiddleware({
    target: "http://localhost:5002",
    changeOrigin: true,
    // SỬA: thêm "/api/recognition"
    pathRewrite: { "^/api/python": "/api/recognition" },
  })
);

// Python backend - health check - SỬA LẠI
app.use(
  "/health/python",
  createProxyMiddleware({
    target: "http://localhost:5002",
    changeOrigin: true,
    pathRewrite: { "^/health/python": "/health" },
  })
);

app.listen(8080, () =>
  console.log("🚀 Gateway running on http://localhost:8080")
);
