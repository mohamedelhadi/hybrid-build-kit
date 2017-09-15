import { IConfiguration, Environments } from './configuration';
import { testing } from './endpoint.json';

export class Configuration implements IConfiguration {

    private envUrl: string = testing;
    public environment: string = Environments.testing;

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
