import { flatten, type BaseDict } from "@solid-primitives/i18n";

export type StrictFlatten<T> = {
  [K in keyof T]: T[K] extends object ? never : T[K];
};

export function strictFlatten<T extends BaseDict>(o: T): StrictFlatten<T> {
  const obj = flatten(o);
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (typeof obj[key] !== "object") {
      result[key] = obj[key] as unknown;
    }
  }
  return result as StrictFlatten<T>;
}

export function unfold<T extends BaseDict>(o: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in o) {
    if (o[key] === null || typeof o[key] === "undefined") {
      continue;
    }
    const keys = key.split(".");
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!Object.prototype.hasOwnProperty.call(current, k)) {
        current[k] = {};
      }
      current = current[k] as Record<string, unknown>;
    }
    current[keys[keys.length - 1]] = o[key];
  }
  return result;
}
