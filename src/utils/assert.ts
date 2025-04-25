import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function assert(
  expr: boolean | ((...arg: unknown[]) => boolean),
  msg?: string,
  status?: ContentfulStatusCode
): void {
  const ok = typeof expr === "boolean" ? expr : expr();
  if (!ok)
    throw new HTTPException(status ?? 412, {
      message: msg ?? "Precondition Failed",
    });
}

export function hasKeys<T extends object>(o: T, k: string | number | symbol | (string | number | symbol)[]): boolean {
  if (typeof o !== "object" || o === null) return false;
  const keys = Array.isArray(k) ? k : [k];
  return keys.every((key) => Object.prototype.hasOwnProperty.call(o, key));
}

export default assert;
