import toml from "toml";
import Bun from "bun"; // Ensure Bun is imported from the correct module
import type { SignatureAlgorithm } from "hono/utils/jwt/jwa";

export interface Config {
  server: {
    host: string;
    port: number;
    runtime: {
      api_base: string;
    };
  };
  secure: {
    jwt_algorithm: SignatureAlgorithm;
    jwt_secret: string;
  };
  i18n: {
    id: string;
    name: string;
    glob: string;
    default: string;
  }[];
}

const config: Config = toml.parse(await Bun.file("config.toml").text());

export default config;
