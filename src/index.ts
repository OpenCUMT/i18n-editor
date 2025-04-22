import config from '@/config';
import { Hono } from 'hono';
import mutex from '@/utils/mutex';
import { getI18nFiles } from '@/utils/list';
import { strictFlatten, unfold } from '@/utils/transform';
import assert, { hasKeys } from '@/utils/assert';
import { auth } from '@/mw/auth';
import { HTTPException } from 'hono/http-exception';

const app = new Hono();

const API_BASE = config.server.runtime.api_base;

const apiRouter = new Hono();


const i18nFiles = getI18nFiles();

apiRouter.get('/i18n', async (c,) => {
    return c.json({
        default: config.i18n.default,
        list: i18nFiles.map(({ name }) => name)
    })
})

apiRouter.get('/i18n/:name', auth, async (c) => {
    const name = c.req.param('name')
    const file = i18nFiles.find((file) => file.name === name);
    if (!file) return c.notFound()

    mutex[`@fs/${file.path}`].acquire();
    const flatJson = await Bun.file(file.path).json().then(strictFlatten)
        .finally(() => mutex[`@fs/${file.path}`].release());
    return c.json(flatJson)
});

apiRouter.patch('/i18n/:name', auth, async (c) => {
    assert(c.req.header('Content-Type') === 'application/json');
    const name = c.req.param('name')
    const file = i18nFiles.find((file) => file.name === name);
    if (!file) return c.notFound()

    const json = await c.req.json();
    assert(hasKeys(json, ["key", "value"]));
    assert(typeof json.key === "string" && (typeof json.value !== "object" || json.value === null));

    const data = await mutex[`@fs/${file.path}`].runExclusive(async () => {
        const flatJson = await Bun.file(file.path).json().then(strictFlatten);
        flatJson[json.key] = json.value;
        const newRaw = unfold(flatJson);
        await Bun.write(file.path, JSON.stringify(newRaw, null, 2));
        return strictFlatten(newRaw);
    })

    return c.json({
        success: true,
        data
    })
})

app.route(API_BASE, apiRouter);

app.onError((err, c) => {
    if (err instanceof HTTPException) {
        return c.text(err.message, err.status)
    }
    console.error(err);
    return c.text('Internal Server Error', 500)
})

export default {
    host: config.server.host,
    port: config.server.port,
    fetch: app.fetch
}
