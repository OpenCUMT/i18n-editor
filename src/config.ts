import toml from 'toml';

export interface Config {
    server: {
        host: string;
        port: number;
        runtime: {
            api_base: string;
        }
    }
    i18n: {
        glob: string;
        default: string;
    }
    frontend: {
        path: string;
    }
}


const config: Config = toml.parse(await Bun.file('config.toml').text());

export default config;
