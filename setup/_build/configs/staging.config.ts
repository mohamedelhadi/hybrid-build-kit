import { IConfiguration, Environments } from './configuration';
import { staging } from './endpoint.json';
import { version } from './version.json';

export class Configuration implements IConfiguration {

    private envUrl: string = staging;
    public environment: string = Environments.staging;
    public version: string = version;

    constructor() {
        // append "/" if it's not already appended
        this.envUrl = this.envUrl.replace(/\/?(\?|#|$)/, '/$1');
    }
    public get baseUrl(): string {
        return this.envUrl;
    }
    public static get instance() {
        return new Configuration();
    }
}
