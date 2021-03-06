"use strict";
import { environments, platforms } from './consts';
import { getVersionDetails } from './version-helper';
import * as fs from 'fs';
import * as path from 'path';
import * as shelljs from 'shelljs';
import chalk from 'chalk';
import * as cheerio from 'cheerio';
import { html as beautify_html } from 'js-beautify';
import * as builder from 'content-security-policy-builder';
export { initialize };
const root = process.cwd();
const cache = {};
const ENDPOINTS = 'ENDPOINTS';
const SETTINGS = 'SETTINGS';
const VERSION_DETAILS = 'VERSION_DETAILS';
function initialize(env, platform) {
    console.log('Targeted Environment: ', chalk.yellow(`${env}`));
    console.log('Targeted Platform: ', chalk.yellow(`${platform}\n`));
    const copyPromise = copy(env);
    const cordovaPromise = prepareCordovaConfig(env, platform);
    const indexPromise = prepareIndex(env, platform);
    const endpointPromise = prepareEndpoint(env);
    const versionPromise = prepareVersion(env);
    // TODO implement copy resources
    return Promise.all([
        copyPromise,
        cordovaPromise,
        indexPromise,
        endpointPromise,
        versionPromise
    ]);
}
function copy(env) {
    console.log(`Copying ${env} configurations...`);
    return new Promise((resolve, reject) => {
        const errors = [];
        const configDir = path.join(root, 'src/app/config');
        if (!fs.existsSync(configDir)) {
            shelljs.mkdir('-p', configDir);
            if (shelljs.error()) {
                errors.push(shelljs.error());
            }
        }
        const configSrc = path.join(root, `_build/configs/configuration.ts`);
        shelljs.cp(configSrc, configDir);
        if (shelljs.error()) {
            errors.push(shelljs.error());
        }
        const envSrc = path.join(root, `_build/configs/${env}.config.ts`);
        shelljs.cp(envSrc, path.join(configDir, 'env.config.ts'));
        if (shelljs.error()) {
            errors.push(shelljs.error());
        }
        const pwaSrc = path.join(root, `src/pwa.js`);
        shelljs.cp(pwaSrc, 'www');
        if (shelljs.error()) {
            errors.push(shelljs.error());
        }
        if (errors.length) {
            for (const err of errors) {
                console.log(chalk.red(err));
            }
            console.log('Error(s) occurred while copying files\n');
            reject();
            return;
        }
        console.log(chalk.green(`Done copying ${env} configurations`));
        resolve();
    });
}
async function prepareCordovaConfig(env, platform) {
    if (platform === platforms.pwa) {
        // a pwa don't use config.xml, so skip this preparation step
        return Promise.resolve();
    }
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
        $('access')
            .first()
            .attr('origin', details.origin);
        $('allow-navigation')
            .first()
            .attr('href', details.origin);
        $('widget').attr('version', details.versionDetails.version);
        $('widget').attr('android-versionCode', details.versionDetails.androidVersionCode);
        $('widget').attr('ios-CFBundleVersion', details.versionDetails.version);
        fs.writeFile(configPath, $.html(), callback('Done preparing config.xml', 'Could not save config.xml!', resolve, reject));
    });
}
async function prepareIndex(env, platform) {
    console.log('Preparing index.html...');
    const indexPath = path.join(root, 'src/index.html');
    // strip bom (UTF-8 with BOM to just UTF-8)
    const content = fs.readFileSync(indexPath, 'utf8').replace(/^\uFEFF/, '');
    const $ = cheerio.load(content, {
        // to avoid converting single quotes (in content security policy) to &apos;
        decodeEntities: false
    });
    // if targeted env is the browser, omit cordova.js otherwise add it
    // cordova script performs plugins initialization that doesn't work on the browser
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
    const html = beautify_html($.html(), {
        preserve_newlines: false
    });
    return new Promise((resolve, reject) => {
        fs.writeFile(indexPath, html, callback('Done preparing index.html', 'Could not save index.html!', resolve, reject));
    });
}
function getCSP(env, endpoint) {
    return new Promise((resolve, reject) => {
        const directives = {
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
                    directives.imgSrc = directives.imgSrc.concat(configs.imgSrc || [], endpoint);
                    directives.scriptSrc = directives.scriptSrc.concat(configs.scriptSrc || [], endpoint);
                    directives.connectSrc = directives.connectSrc.concat(configs.connectSrc || [], endpoint);
                }
            }
            resolve(builder({
                directives
            }));
        });
    });
}
function callback(successMessage, errMessage, resolve, reject) {
    return err => {
        if (err) {
            console.log(chalk.red(err));
            console.log(chalk.white(errMessage + '\n'));
            reject();
        }
        else {
            console.log(chalk.green(successMessage));
            resolve();
        }
    };
}
async function getConfigDetails(env) {
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
        versionDetails: await getEnvVersionDetails(env)
    };
}
async function getEndpointOrigin(env) {
    switch (env) {
        case environments.browser:
        case environments.dev:
            return '*';
        default:
            const endpoints = getEndpoints();
            return getOrigin(endpoints[env]);
    }
}
function getOrigin(url) {
    return url.replace(/^((\w+:)?\/\/[^\/]+\/?).*$/, '$1').replace(/\/$/, '');
}
function prepareEndpoint(env) {
    const endpoints = getEndpoints();
    const endpoint = {
        [env]: endpoints[env]
    };
    return writeJSON('src/app/config/endpoint.json', endpoint);
}
async function prepareVersion(env) {
    const { version } = await getEnvVersionDetails(env);
    return writeJSON('src/app/config/version.json', {
        version
    });
}
function writeJSON(filePath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path.join(root, filePath), JSON.stringify(content, null, '\t'), err => {
            if (err) {
                console.log(chalk.red(err.toString()));
                console.log(`Could not write to: '${filePath}\n`);
                reject();
            }
            else {
                resolve();
            }
        });
    });
}
function getSettings() {
    if (!cache[SETTINGS]) {
        cache[SETTINGS] = readJSON('_build/settings.json');
    }
    return cache[SETTINGS];
}
function getEndpoints() {
    if (!cache[ENDPOINTS]) {
        cache[ENDPOINTS] = readJSON('_build/json/endpoints.json');
    }
    return cache[ENDPOINTS];
}
async function getEnvVersionDetails(env) {
    if (!cache[VERSION_DETAILS]) {
        cache[VERSION_DETAILS] = await getVersionDetails(env);
    }
    return cache[VERSION_DETAILS];
}
function readJSON(filePath) {
    const absolutePath = path.join(root, filePath);
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}
//# sourceMappingURL=initializer.js.map