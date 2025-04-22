import { createMiddleware } from "hono/factory";

export const auth = createMiddleware(async (c, next) => {
    const auth = c.req.header("Token")
    if (auth === undefined) { // TODO
        return await next();
    }
    const u = new URL(c.req.url, "http://localhost");
    const path = u.pathname + u.search;
    return c.redirect(`/account/login?redirect=${encodeURIComponent(path)}`, 302);
})