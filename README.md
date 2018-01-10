# hybrid-build-kit

> A command line interface for multi-environment builds.

## Features

* Environments: browser - dev - testing - staging - production
* Platforms: android - ios - pwa
* Easy management of environments' urls and whitelisted third party endpoints
* Auto update based on targeted env: \* CSP (content-security-policy) and access origin
  * App name and package name
  * Version number
* Custom config file for each environment

**Prerequisites**

* Ionic v2 and above.

## Getting started

### Intro

The library provides a command that you run before each build to update your project with the targeted environment's configurations.

So you simply run

```
hybrid-build-kit initialize testing // hybrid-build-kit initialize <env> <platform>, defaults to 'browser' 'android'
```

and your project is ready for build.

### Setup

But before running the command there are few things that needs to be made.

#### 1. Install the library

```bash
npm install hybrid-build-kit --save-dev
```

#### 2. Add: "setup": "hybrid-build-kit setup" to your npm scripts

then run the script

```bash
npm run setup
```

This command will set up your project to support the library. It does so by copying the necessary configuration files to your project and modify few other files.

#### 3. Update **main.ts** file

Found at _'project/src/app/main.ts'_, this file should be updated by adding the following lines

```javascript
import { enableProdMode } from "@angular/core";
import { Environments } from "./config/configuration";
import { Configuration } from "./config/env.config";

if (Configuration.instance.environment === Environments.production) {
  enableProdMode();
}
```

and that's before the line `platformBrowserDynamic().bootstrapModule(AppModule);`

#### 4. Add 'Configuration' as a service (provider)

This step is optional. But it's recommended to follow as best practice, and to benefit from angular's DI.

In your **app.module.ts** (or the module where you add shared services), import the Configuration class and add it to your providers list.

```javascript
import { Configuration } from "./config/env.config";
...
providers: [
  Configuration
  ...
]
```

#### 5. Add environments' urls

Head to _'project/\_build/json/endpoints.json'_ and enter the urls. It's not mandatory to enter urls for all of the environments, just the ones you are planning to target.

```json
{
  "browser": "https://localhost",
  "dev": "https://your-dev-server.com",
  ...
}
```

Measurements are taken so that only the targeted environment's url will end up in the app bundle.

#### 6. Add declarations.d.ts to your src folder, with the content below (allows importing json files as modules)

```javascript
declare module '*.json';
```

<br/>
And that's it for setting up your project.

**_Note_** the 'config' and '\_build' folders were added to your project when you ran the setup command.

### Usage

To use the library you can run initialize command as shown earlier `hybrid-build-kit initialize <env> <platform>`

But it's better to add the command to your existing build scripts. **example**:

```json
"scripts": {
  ...
  "ionic:serve": "ionic-app-scripts serve",
  "preionic:serve": "npm run initialize",
  "initialize": "hybrid-build-kit initialize",
  "android-dev": "npm run initialize dev && ionic cordova run android",
  "android-production": "npm run initialize production && ionic cordova run android --release --prod --generateSourceMap",
  "pwa-staging": "npm run initialize staging pwa && npm run build --generateSourceMap",
  "ios-testing": "npm run initialize testing ios && ionic cordova run ios --target='iPhone-6'"
}
```

<br/>
Check the example project for a quick review/test.

---

## TODO

* Add more documentation
* Add support for environment based assets
* Add Tests
* Support regular angular projects

---

## License

MIT
