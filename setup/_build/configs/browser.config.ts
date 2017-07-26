import { IConfiguration, environments } from './configuration';
import { browser } from '../json/endpoints';

export class Configuration implements IConfiguration {

    public environment: string = environments.browser;
    private baseUrl: string = browser;
    public mockApi = false;

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
