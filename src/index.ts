import config from "@/config";
import { auth, extractToken, verifyToken } from "@/mw/auth";
import assert, { hasKeys } from "@/utils/assert";
import { getI18nProjects } from "@/utils/list";
import mutex from "@/utils/mutex";
import { strictFlatten, unfold } from "@/utils/transform";
import Bun from "bun";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

const app = new Hono();

const API_BASE = config.server.runtime.api_base;

const apiRouter = new Hono();

const projects = getI18nProjects();

apiRouter.get("/user", async (c) => {
  const token = extractToken(c.req.header("Authorization"));
  const data = await verifyToken(token, config.secure.jwt_secret, config.secure.jwt_algorithm);
  if (data) {
    return c.json(data);
  }
  return c.json({ code: 401, message: "Unauthorized" }, 401);
});

// get all projects
apiRouter.get("/i18n", async (c) => {
  return c.json(
    Object.entries(config.i18n).map(([_, v]) => ({
      id: v.id,
      name: v.name,
    }))
  );
});

// get configuration of locales of a project
apiRouter.get("/i18n/:proj_id", async (c) => {
  const id = c.req.param("proj_id");
  const project = Object.prototype.hasOwnProperty.call(projects, id) ? projects[id] : null;
  if (!project) return c.notFound();
  return c.json({
    id: project.id,
    name: project.name,
    default: project.default,
    locales: project.files.map(({ locale }) => locale),
  });
});

// get translation file of a locale of a project
apiRouter.get("/i18n/:proj_id/:locale", auth, async (c) => {
  const id = c.req.param("proj_id");
  const project = Object.prototype.hasOwnProperty.call(projects, id) ? projects[id] : null;
  if (!project) return c.notFound();
  const locale = c.req.param("locale");
  const file = project.files.find((file) => file.locale === locale);
  if (!file) return c.notFound();

  mutex[`@fs/${file.filepath}`].acquire();
  const flatJson = await Bun.file(file.filepath)
    .json()
    .then(strictFlatten)
    .finally(() => mutex[`@fs/${file.filepath}`].release());
  return c.json(flatJson);
});

// modify translation file of a locale of a project
apiRouter.patch("/i18n/:proj_id/:locale", auth, async (c) => {
  assert(c.req.header("Content-Type") === "application/json");

  const id = c.req.param("proj_id");
  const project = Object.prototype.hasOwnProperty.call(projects, id) ? projects[id] : null;
  if (!project) return c.notFound();
  const locale = c.req.param("locale");
  const file = project.files.find((file) => file.locale === locale);
  if (!file) return c.notFound();

  const json = await c.req.json();
  assert(hasKeys(json, ["key", "value"]));
  assert(typeof json.key === "string" && (typeof json.value !== "object" || json.value === null));

  const data = await mutex[`@fs/${file.filepath}`].runExclusive(async () => {
    const flatJson = await Bun.file(file.filepath).json().then(strictFlatten);
    flatJson[json.key] = json.value;
    const newRaw = unfold(flatJson);
    await Bun.write(file.filepath, JSON.stringify(newRaw, null, 2));
    return strictFlatten(newRaw);
  });

  return c.json({
    success: true,
    data,
  });
});

app.route(API_BASE, apiRouter);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.text(err.message, err.status);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
});

export default {
  host: config.server.host,
  port: config.server.port,
  fetch: app.fetch,
};
