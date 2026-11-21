import { defineConfig } from "vite";

export default defineConfig({
  envDir: process.env.HEMOVIA_VITE_ENV_DIR || process.cwd(),
  esbuild: { jsx: "automatic" },
  server: {
    proxy: { "/api": { target: process.env.HEMOVIA_API_PROXY_TARGET || "http://localhost:8080", changeOrigin: true } },
  },
});
