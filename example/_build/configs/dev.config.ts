import { IConfiguration, environments } from './configuration';
import { dev } from './endpoint.json';

export class Configuration implements IConfiguration {

    public environment: string = environments.dev;
    private baseUrl: string = dev;

    constructor() {
        // append "/" if it's not already appended
        this.baseUrl = this.baseUrl.replace(/\/?(\?|#|$)/, '/$1');
    }
    public get BaseUrl(): string {
        return this.baseUrl;
    }
    public static get Instance() {
        return new Configuration();
    }
}
