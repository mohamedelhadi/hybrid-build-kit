"use strict";
import { environments } from './consts';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
export { getVersionDetails, major, minor, patch, patchDigits, minorDigits };
const root = path.join(process.cwd());
// version segments
const major = 0;
const minor = 1;
const patch = 2;
const patchDigits = 3;
const minorDigits = 2;
async function getVersionDetails(env) {
    switch (env) {
        case environments.production:
        case environments.staging:
        case environments.testing:
            return await getDetails(env);
        case environments.dev:
        case environments.browser:
            // no value in increasing development version?
            return Promise.resolve({
                version: '1.0.0',
                segments: '1.0.0'.split('.'),
                androidVersionCode: 100000
            });
        default:
            console.log(chalk.red(`\nUnknown env: '${env}'`));
            return Promise.reject(null);
    }
}
async function getDetails(env) {
    const versionsPath = path.join(root, '_build/json/versions.json');
    const versions = JSON.parse(fs.readFileSync(versionsPath, 'utf8'));
    const segments = versions[env].split('.');
    return {
        segments,
        androidVersionCode: getAndroidVersionCode(segments),
        version: `${segments[major]}.${segments[minor]}.${segments[patch]}`
    };
}
function getAndroidVersionCode(segments) {
    // given version xx.yy.zzz, maximum possible version code is: 9,999,999
    // maximum version code value allowed by google play is: 2,100,000,000
    // https://developer.android.com/studio/publish/versioning.html
    return (parseInt(segments[major], 10) * getRange(minorDigits + patchDigits) +
        parseInt(segments[minor], 10) * getRange(patchDigits) +
        parseInt(segments[patch], 10));
}
function getRange(zerosToAdd) {
    const digits = zerosToAdd + 1;
    return +'1'.padEnd(digits, '0');
}
//# sourceMappingURL=version-helper.js.map