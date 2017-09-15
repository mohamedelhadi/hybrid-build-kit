import { IConfiguration, Environments } from './configuration';
import { production } from './endpoint.json';

export class Configuration implements IConfiguration {


    private envUrl: string = production;
    public environment: string = Environments.production;

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
