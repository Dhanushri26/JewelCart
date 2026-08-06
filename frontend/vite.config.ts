import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const API_TARGET =
  process.env.VITE_API_TARGET ||
  "https://fpgg90w2y8.execute-api.ap-southeast-1.amazonaws.com";

const config = {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: /^react(\/.*)?$/,
        replacement: `${path.resolve(__dirname, "node_modules/react").replace(/\\/g, "/")}$1`,
      },
      {
        find: /^react-dom(\/.*)?$/,
        replacement: `${path.resolve(__dirname, "node_modules/react-dom").replace(/\\/g, "/")}$1`,
      },
      {
        find: /^aws-amplify(\/.*)?$/,
        replacement: `${path.resolve(__dirname, "node_modules/aws-amplify/dist/esm").replace(/\\/g, "/")}$1`,
      },
      {
        find: "@testing-library/react",
        replacement: path
          .resolve(__dirname, "node_modules/@testing-library/react")
          .replace(/\\/g, "/"),
      },
      {
        find: "@testing-library/user-event",
        replacement: path
          .resolve(__dirname, "node_modules/@testing-library/user-event")
          .replace(/\\/g, "/"),
      },
      {
        find: "@testing-library/jest-dom",
        replacement: path
          .resolve(__dirname, "node_modules/@testing-library/jest-dom")
          .replace(/\\/g, "/"),
      },
      {
        find: "tests/frontend",
        replacement: path
          .resolve(__dirname, "../tests/frontend")
          .replace(/\\/g, "/"),
      },
    ],
    dedupe: ["react", "react-dom"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    dir: "../tests/frontend",
    include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["lcov", "html", "json-summary", "text"],
      all: false,
      include: [
        "src/api/**/*.{js,jsx,ts,tsx}",
        "src/hooks/**/*.{js,jsx,ts,tsx}",
        "src/utils/**/*.{js,jsx,ts,tsx}",
      ],
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "../tests/frontend")],
    },
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
