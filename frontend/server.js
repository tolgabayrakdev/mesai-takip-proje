import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL =
  process.env.BACKEND_URL ||
  "https://mesai-takip-proje-production.up.railway.app";

// /api isteklerini backend'e proxy'le — cookie same-origin olarak gider
app.use(
  "/api",
  createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
  })
);

// Vite build çıktısını serve et
app.use(express.static(join(__dirname, "dist")));

// React SPA — tüm route'ları index.html'e yönlendir
app.get("*", (_req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
