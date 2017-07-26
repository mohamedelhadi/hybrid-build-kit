import { IConfiguration, environments } from '../_build/configs/configuration';
import { production } from './endpoint.json';

export class Configuration implements IConfiguration {

    public environment: string = environments.production;
    private baseUrl: string = production;

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
