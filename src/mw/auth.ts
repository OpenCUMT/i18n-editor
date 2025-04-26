import config from "@/config";
import { createMiddleware } from "hono/factory";
import { Jwt } from "hono/utils/jwt";
import type { SignatureAlgorithm } from "hono/utils/jwt/jwa";

interface UserData {
  id: string;
  account: string;
  nickname: string;
  permissions: number[];
  exp: number;
}

export function extractToken(auth: string | null | undefined) {
  if (!auth) return null;
  const match = /^Bearer (.+)$/.exec(auth);
  if (!match) return null;
  return match[1];
}

export async function verifyToken(token: string | null | undefined, secret: string, alg?: SignatureAlgorithm) {
  if (!token) return null;
  const data = (await Jwt.verify(token, secret, alg).catch((_) => null)) as UserData | null;
  if (data === null || data.exp < Date.now() / 1000) return null;
  return data;
}

export const auth = createMiddleware(async (c, next) => {
  const token = extractToken(c.req.header("Authorization"));
  const data = await verifyToken(token, config.secure.jwt_secret, config.secure.jwt_algorithm);
  if (data) {
    if (!data.permissions.includes(9)) {
      return c.text("Forbidden", 403);
    }
    return await next();
  }
  return c.text("Unauthorized", 401);
});
