﻿import { IConfiguration, environments } from './configuration';
import { testing } from '../json/endpoints';

export class Configuration implements IConfiguration {

    public environment: string = environments.testing;
    private baseUrl: string = testing;

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