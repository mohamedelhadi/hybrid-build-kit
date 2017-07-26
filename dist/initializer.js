"use strict";
import { environments } from './consts';
import { getVersionDetails } from './version-helper';
import { default as config } from '../config.json';
import * as fs from 'fs';
import * as path from 'path';
import * as shelljs from 'shelljs';
import * as chalk from 'chalk';
import * as cheerio from 'cheerio';
import { html as beautify_html } from 'js-beautify';
// no @types so require instead of import
const builder = require('content-security-policy-builder');
export { initialize };
const root = path.join(process.cwd(), 'src');
function initialize(env, platform) {
    console.log('Targeted Environment: ', chalk.yellow(`${env}`));
    console.log('Targeted Platform: ', chalk.yellow(`${platform}\n`));
    const configPromise = copyConfiguration(env);
    const cordovaPromise = prepareCordovaConfig(env);
    const indexPromise = prepareIndex(env, platform);
    return Promise.all([configPromise, cordovaPromise, indexPromise]);
}
function copyConfiguration(env) {
    console.log(`Copying ${env} configurations...`);
    return new Promise((resolve, reject) => {
        const src = path.join(root, `_build/configs/${env}.config.ts`);
        const target = path.join(root, 'app/env.config.ts');
        shelljs.cp(src, target);
        const err = shelljs.error();
        if (err) {
            console.log(chalk.red(err));
            console.log('\nFailed to copy env config file');
            console.log(`source: ${src}\ntarget: ${target}\n`);
            reject();
            return;
        }
        console.log(chalk.green(`Done copying ${env} configurations`));
        resolve();
    });
}
async function prepareCordovaConfig(env) {
    console.log('Preparing config.xml...');
    const details = await getConfigDetails(env);
    return new Promise((resolve, reject) => {
        const configPath = path.join(process.cwd(), 'config.xml');
        const $ = cheerio.load(fs.readFileSync(configPath, 'utf8'), {
            xmlMode: true,
            decodeEntities: false
        });
        $('widget').attr('id', details.packageName);
        $('name').text(details.appName);
        $('access').first().attr('origin', details.endpoint);
        $('allow-navigation').attr('href', details.endpoint);
        $('widget').attr('version', details.versionDetails.version);
        $('widget').attr('android-versionCode', details.versionDetails.androidVersionCode);
        $('widget').attr('ios-CFBundleVersion', details.versionDetails.version);
        fs.writeFile(configPath, $.html(), callback('Done preparing config.xml', 'Could not save config.xml!', resolve, reject));
    });
}
async function prepareIndex(env, platform) {
    console.log('Preparing index.html...');
    const indexPath = path.join(root, 'index.html');
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
    const endpoint = await getEndpoint(env);
    const csp = await getCSP(env, endpoint);
    $('#csp').attr('content', csp);
    $('title').text(config.app_name);
    const html = beautify_html($.html());
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
                console.log(chalk.red('\nCould not read whitelist file!\npath: ${whitelistPath}'));
                reject(err);
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
    let appName = config.app_name;
    let packageName = config.package_name;
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
        endpoint: await getEndpoint(env),
        versionDetails: await getVersionDetails(env)
    };
}
async function getEndpoint(env) {
    const endpointsPath = path.join(root, '_build/json/endpoints.json');
    const endpoints = JSON.parse(fs.readFileSync(endpointsPath, 'utf8'));
    switch (env) {
        case environments.browser:
        case environments.dev:
            return '*';
        default:
            return getOrigin(endpoints.env);
    }
}
function getOrigin(url) {
    return url.replace(/^((\w+:)?\/\/[^\/]+\/?).*$/, '$1').replace(/\/$/, '');
}
/* function copyResources(env, platform) {
    console.log(chalk.cyan('Copying resources...'));
    return new Promise((resolve, reject) => {
        copy('src/environments/resources/' + platform + '/icons/' + env + '/*',
        'resources/' + platform + '/icon',
        callback('Done copying resources', 'Couldn\'t copy resources!', resolve, reject));
    });
}*/
//# sourceMappingURL=initializer.js.map