import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';

import { enableProdMode } from "@angular/core";
import { environments } from "./config/configuration";
import { Configuration } from "./config/env.config";

if (Configuration.Instance.environment === environments.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
