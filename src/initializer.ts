import { environments, platforms } from './consts';
import { getVersionDetails } from './version-helper';
import * as fs from 'fs';
import * as path from 'path';
import * as shelljs from 'shelljs';
import * as chalk from 'chalk';
import * as cheerio from 'cheerio';
import { html as beautify_html } from 'js-beautify';
// no @types so require instead of import
const builder = require('content-security-policy-builder');

export { initialize };

const root = process.cwd();
let settings: ISettings;
let endpoints: IEndpoints;

function initialize(env: string, platform: string) {
    console.log('Targeted Environment: ', chalk.yellow(`${env}`));
    console.log('Targeted Platform: ', chalk.yellow(`${platform}\n`));

    const configPromise = copyConfiguration(env);
    const cordovaPromise = prepareCordovaConfig(env);
    const indexPromise = prepareIndex(env, platform);
    const endpointPromise = prepareEndpoint(env);
    // TODO implement copy resources

    return Promise.all([configPromise, cordovaPromise, indexPromise, endpointPromise]);
}

function copyConfiguration(env: string) {
    console.log(`Copying ${env} configurations...`);
    return new Promise((resolve, reject) => {
        const configDir = path.join(root, 'src/app/config');
        if (!fs.existsSync(configDir)) {
            shelljs.mkdir('-p', configDir);
        }

        const srcConfig = path.join(root, `_build/configs/configuration.ts`);
        shelljs.cp(srcConfig, configDir);

        const srcEnv = path.join(root, `_build/configs/${env}.config.ts`);
        shelljs.cp(srcEnv, path.join(configDir, 'env.config.ts'));

        const err = shelljs.error();
        if (err) {
            console.log(chalk.red(err));
            console.log('\nFailed to copy env config files');
            reject();
            return;
        }
        console.log(chalk.green(`Done copying ${env} configurations`));
        resolve();
    });
}

async function prepareCordovaConfig(env: string) {
    console.log('Preparing config.xml...');
    const details = await getConfigDetails(env);
    return new Promise((resolve, reject) => {
        const configPath = path.join(root, 'config.xml');
        const $ = cheerio.load(fs.readFileSync(configPath, 'utf8'), {
            xmlMode: true,
            decodeEntities: false
        });
        $('widget').attr('id', details.packageName);
        $('name').text(details.appName);
        $('access').first().attr('origin', details.origin);
        $('allow-navigation').attr('href', details.origin);
        $('widget').attr('version', details.versionDetails.version);
        $('widget').attr('android-versionCode', details.versionDetails.androidVersionCode);
        $('widget').attr('ios-CFBundleVersion', details.versionDetails.version);
        fs.writeFile(
            configPath,
            $.html(),
            callback(
                'Done preparing config.xml',
                'Could not save config.xml!',
                resolve, reject
            )
        );
    });
}

async function prepareIndex(env: string, platform: string) {
    console.log('Preparing index.html...');
    const indexPath = path.join(root, 'src/index.html');
    // strip bom (UTF-8 with BOM to just UTF-8)
    const content = fs.readFileSync(indexPath, 'utf8').replace(/^\uFEFF/, '');
    const $ = cheerio.load(content, {
        // to avoid converting single quotes (in content security policy) to &apos;
        decodeEntities: false
    });
    // if targeted env is the browser, omit cordova.js otherwise add it
    // cordova script performs an initialization that doesn't work on the browser
    // so we remove it (however note that cordova script is required on an emulator/real device)
    const cordovaScript = env === environments.browser || platform === 'pwa' ? '' : 'cordova.js';
    $('#cordova-script').attr('src', cordovaScript);
    $('#service-worker').attr('src', platform === 'pwa' ? 'pwa.js' : '');

    // Content-Security-Policy
    const origin = await getEndpointOrigin(env);
    const csp = await getCSP(env, origin);
    $('#csp').attr('content', csp);

    const settings = getSettings();
    $('title').text(settings.app_name);

    const html = beautify_html($.html());
    return new Promise((resolve, reject) => {
        fs.writeFile(
            indexPath,
            html,
            callback('Done preparing index.html', 'Could not save index.html!', resolve, reject)
        );
    });
}

function getCSP(env: string, endpoint: string) {
    return new Promise((resolve, reject) => {
        const directives: any = {
            defaultSrc: [],
            styleSrc: [],
            frameSrc: [],
            imgSrc: [],
            scriptSrc: [],
            connectSrc: []
        };
        const whitelistPath = path.join(root, '_build/json/whitelist.json');
        fs.readFile(whitelistPath, 'utf8', (err, data) => {
            if (err) {
                console.log(chalk.red(err.toString()));
                console.log('\nCould not read whitelist file!\npath: ${whitelistPath}');
                reject();
                return;
            }
            const whitelist = JSON.parse(data);
            // tslint:disable-next-line:forin
            for (const key in whitelist) {
                if (key === env || key === 'default') {
                    const configs = whitelist[key];
                    directives.defaultSrc = directives.defaultSrc.concat(configs.defaultSrc || []);
                    directives.styleSrc = directives.styleSrc.concat(configs.styleSrc || []);
                    directives.frameSrc = directives.frameSrc.concat(configs.frameSrc || []);
                    directives.imgSrc = directives.imgSrc
                        .concat(configs.imgSrc || [], endpoint);
                    directives.scriptSrc = directives.scriptSrc
                        .concat(configs.scriptSrc || [], endpoint);
                    directives.connectSrc = directives.connectSrc
                        .concat(configs.connectSrc || [], endpoint);
                }
            }
            resolve(builder({
                directives
            }));
        });
    });
}

function callback(
    successMessage: string, errMessage: string,
    resolve: Function, reject: Function): (err: string) => void {
    return err => {
        if (err) {
            console.log(chalk.red(err));
            console.log(chalk.white(errMessage + '\n'));
            reject();
        } else {
            console.log(chalk.green(successMessage));
            resolve();
        }
    };
}

async function getConfigDetails(env: string) {
    const settings = getSettings();
    let appName = settings.app_name;
    let packageName = settings.package_name;
    switch (env) {
        case environments.production:
            break;
        default:
            packageName = packageName + '.' + env;
            appName = appName + ' - ' + env;
    }
    return {
        packageName,
        appName,
        origin: await getEndpointOrigin(env),
        versionDetails: await getVersionDetails(env)
    };
}

async function getEndpointOrigin(env: string): Promise<string> {
    switch (env) {
        case environments.browser:
        case environments.dev:
            return '*';
        default:
            const endpoints = getEndpoints();
            return getOrigin(endpoints[env]);
    }
}

function getOrigin(url: string) {
    return url.replace(/^((\w+:)?\/\/[^\/]+\/?).*$/, '$1').replace(/\/$/, '');
}

function prepareEndpoint(env: string) {
    return new Promise((resolve, reject) => {
        const endpoints = getEndpoints();
        const endpoint = {
            [env]: endpoints[env]
        };
        fs.writeFile(
            path.join(root, 'src/app/config/endpoint.json'),
            JSON.stringify(endpoint, null, '\t'),
            err => {
                if (err) {
                    console.log(chalk.red(err.toString()));
                    console.log('Could not save endpoint file\n');
                    reject();
                } else {
                    resolve();
                }
            });
    });
}

function getSettings() {
    if (!settings) {
        const settingsPath = path.join(root, '_build/settings.json');
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    return settings;
}

function getEndpoints() {
    if (!endpoints) {
        const endpointsPath = path.join(root, '_build/json/endpoints.json');
        endpoints = JSON.parse(fs.readFileSync(endpointsPath, 'utf8'));
    }
    return endpoints;
}

interface ISettings {
    app_name: string;
    package_name: string;
}

interface IEndpoints {
    [index: string]: string;
}

/* function copyResources(env, platform) {
    console.log(chalk.cyan('Copying resources...'));
    return new Promise((resolve, reject) => {
        copy('src/environments/resources/' + platform + '/icons/' + env + '/*', 
        'resources/' + platform + '/icon', 
        callback('Done copying resources', 'Couldn\'t copy resources!', resolve, reject));
    });
}*/
