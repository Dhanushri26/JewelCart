import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const API_TARGET =
  process.env.VITE_API_TARGET ||
  "https://fpgg90w2y8.execute-api.ap-southeast-1.amazonaws.com";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    css: true,
  },
  server: {
    proxy: {
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
        secure: true,
        rewrite: (path: string) => path.replace(/^\/api/, ""),
        configure: (proxy: any) => {
          proxy.on("proxyRes", (proxyRes: any, _req: any, res: any) => {
            res.setHeader(
              "Access-Control-Allow-Origin",
              "http://localhost:5173",
            );
            res.setHeader(
              "Access-Control-Allow-Methods",
              "GET,POST,PUT,PATCH,DELETE,OPTIONS",
            );
            res.setHeader(
              "Access-Control-Allow-Headers",
              "Content-Type,Authorization,Idempotency-Key,x-user-id,x-user-role,x-user-email,x-business-id",
            );
            res.setHeader("Access-Control-Allow-Credentials", "true");
            res.setHeader("Vary", "Origin");

            if (proxyRes.statusCode === 204) {
              res.statusCode = 204;
            }
          });
        },
      },
    },
  },
});
