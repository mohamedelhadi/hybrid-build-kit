﻿import { IConfiguration, environments } from '../_build/configs/configuration';
import { staging } from './endpoint.json';

export class Configuration implements IConfiguration {

    public environment: string = environments.staging;
    private baseUrl: string = staging;

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
