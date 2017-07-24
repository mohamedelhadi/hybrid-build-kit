"use strict";
import { environments } from './consts';
import * as fs from 'fs';
import * as path from 'path';
import * as chalk from 'chalk';
export { getVersionDetails };
const root = path.join(process.cwd(), 'src');
// version segments
const major = 0;
const minor = 1;
const patch = 2;
async function getVersionDetails(env) {
    switch (env) {
        case environments.production:
        case environments.staging:
        case environments.testing:
            return await getDetails(env);
        case environments.dev:
        case environments.browser:
            // there is no value in increasing development version
            return Promise.resolve({
                version: '1.0.0',
                segments: '1.0.0'.split('.'),
                androidVersionCode: 100000
            });
        default:
            console.log(chalk.red(`\nUnknown env: '${env}'`));
            return Promise.reject(new Error('Unknown environment'));
    }
}
async function getDetails(env) {
    const versionsPath = path.join(root, '_build/json/versions.json');
    const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
    const segments = versions[env].split('.');
    return {
        segments,
        androidVersionCode: getAndroidVersionCode(segments),
        version: `${segments[major]}.
                ${segments[minor]}.
                ${segments[patch]}`
    };
}
function getAndroidVersionCode(segments) {
    return parseInt(segments[major], 10) * 10000 +
        parseInt(segments[minor], 10) * 100 +
        parseInt(segments[patch], 10);
}
//# sourceMappingURL=version-helper.js.map