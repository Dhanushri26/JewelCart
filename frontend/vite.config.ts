import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import type { IncomingMessage, ServerResponse } from "node:http";

const API_TARGET =
  process.env.VITE_API_TARGET ||
  "https://fpgg90w2y8.execute-api.ap-southeast-1.amazonaws.com";

const config = {
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
        configure: (proxy: {
          on: (
            event: string,
            listener: (
              proxyRes: { statusCode?: number },
              _req: IncomingMessage,
              res: ServerResponse,
            ) => void,
          ) => void;
        }) => {
          proxy.on("proxyRes", (proxyRes, _req, res) => {
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
};

export default defineConfig(config as Parameters<typeof defineConfig>[0]);
