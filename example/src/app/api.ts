import { Injectable } from "@angular/core";
import { Http, RequestOptionsArgs } from "@angular/http";

import { Observable } from "rxjs/Observable";
import "rxjs/add/operator/map";
import "rxjs/add/operator/catch";
import "rxjs/add/observable/throw";

import { Configuration } from "./config/env.config";

@Injectable()
export class Api {
    private readonly defaults: IApiOptions = {
        appendBaseUrl: true
    };
    constructor(private http: Http, private config: Configuration) {
    }
    public get(url: string, options?: IApiOptions) {
        return this.request("GET", { url, options });
    }
    public post(url: string, data?: any, options?: IApiOptions) {
        return this.request("POST", { url, data, options });
    }
    public update(url: string, data?: any, options?: IApiOptions) {
        return this.request("PUT", { url, data, options });
    }
    public delete(url: string, options?: IApiOptions) {
        return this.request("DELETE", { url, options });
    }
    private request(method: string, { url, data = {}, options = {} }: { url: string, data?: any, options?: IApiOptions }) {
        options = Object.assign(this.defaults, options);
        url = (options.appendBaseUrl) ? this.appendBaseUrl(url) : url;
        options.method = method;
        options.body = data;
        return this.http
            .request(url, options)
            .map(res => res.text() ? res.json() : {})
            .catch(err => {
                return Observable.throw(err);
            });
    }
    private appendBaseUrl(shortUrl: string) {
        return this.config.BaseUrl + "api/" + shortUrl;
    }
}
export interface IApiOptions extends RequestOptionsArgs {
    appendBaseUrl?: boolean;
}
