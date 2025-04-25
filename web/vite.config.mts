import fs from "node:fs";
import path from "node:path";
import type { Config } from "@/config";
import suidPlugin from "@suid/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import toml from "toml";
import { defineConfig, loadEnv } from "vite";
import viteCompression from "vite-plugin-compression";
import solidPlugin from "vite-plugin-solid";

const config: Config = toml.parse(fs.readFileSync(path.resolve(__dirname, "config.toml"), "utf-8"));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const isDev = mode === "development" || process.env.NODE_ENV === "development";
  const isProd = !isDev;
  const VITE_BUILD_BASE = env.VITE_BUILD_BASE || "";

  return {
    plugins: [
      suidPlugin(),
      solidPlugin(),
      tailwindcss(),
      viteCompression(),
      {
        name: "toml-loader",
        transform(code, id) {
          if (id.endsWith(".toml")) {
            return `export default ${JSON.stringify(toml.parse(code))};`;
          }
        },
      },
    ],
    server: {
      port: 4321,
      proxy: {
        [config.api_base]: {
          target: process.env.VITE_DEV_API_TARGET || "http://localhost:5030/api",
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.substring(config.api_base.length),
        },
      },
    },
    base: VITE_BUILD_BASE || "/",
    build: {
      target: "es2022",
      minify: isProd,
      sourcemap: isDev,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
