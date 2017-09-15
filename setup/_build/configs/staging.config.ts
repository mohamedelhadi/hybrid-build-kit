import { IConfiguration, Environments } from './configuration';
import { staging } from './endpoint.json';

export class Configuration implements IConfiguration {

    private envUrl: string = staging;
    public environment: string = Environments.staging;

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
