import { IConfiguration, Environments } from './configuration';
import { browser } from './endpoint.json';

export class Configuration implements IConfiguration {

    private envUrl: string = browser;
    public environment: string = Environments.browser;
    public mockApi = false;

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
