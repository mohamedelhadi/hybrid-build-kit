import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app.module';

import { enableProdMode } from "@angular/core";
import { Environments } from "./config/configuration";
import { Configuration } from "./config/env.config";

if (Configuration.instance.environment === Environments.production) {
    enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
