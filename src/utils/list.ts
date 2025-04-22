import config from '@/config';
import path from 'node:path';

export function getI18nFiles() {
    const glob = new Bun.Glob(config.i18n.glob);
    const files = [];
    for (const fp of glob.scanSync()) {
        const filename = path.basename(fp);
        const ext = path.extname(fp);
        const name = filename.slice(0, filename.length - ext.length);
        files.push({
            name,
            ext,
            filename,
            path: fp
        });
    }
    return files;
}