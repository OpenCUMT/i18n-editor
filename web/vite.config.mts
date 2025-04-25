import path from "node:path";
import suidPlugin from "@suid/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import toml from "toml";
import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";
import solidPlugin from "vite-plugin-solid";

export default defineConfig(({ mode }) => {
  const isDev = mode === "development" || process.env.NODE_ENV === "development";
  const isProd = !isDev;

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
        "/api": {
          target: process.env.VITE_DEV_API_TARGET || "http://localhost:5030",
          changeOrigin: true,
          ws: true,
        },
      },
    },
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
