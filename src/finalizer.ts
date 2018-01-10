import { environments, platforms } from './consts';
import { getVersionDetails } from './version-helper';
import * as fs from 'fs';
import * as path from 'path';
import * as shelljs from 'shelljs';
import chalk from 'chalk';
const padStart = require('lodash/padStart');

const root = process.cwd();

export { copyOutput };

async function copyOutput(env: string, platform: string) {
  if (platform === platforms.android) {
    console.log('Copying ' + platform + ' build output..');
    const crosswalkBuild = isCrosswalkBuild();
    const releaseApk = `platforms/android/build/outputs/apk/${
      crosswalkBuild ? 'android-armv7-release' : 'android-release'
    }.apk`;
    const debugApk = `platforms/android/build/outputs/apk/${
      crosswalkBuild ? 'android-armv7-debug' : 'android-debug'
    }.apk`;
    const source = path.join(
      root,
      env === environments.production || env === environments.staging
        ? releaseApk
        : debugApk
    );

    const destination = path.join(root, `bin/${platform}/${env}`);
    if (!fs.existsSync(destination)) {
      shelljs.mkdir('-p', destination);
    }
    const { segments } = await getVersionDetails(env);
    const formattedVersion = `${segments[0]}.${pad(segments[1])}.${pad(
      segments[2],
      3
    )}`;
    const target = path.join(destination, `${env}_${formattedVersion}.apk`);

    if (fs.existsSync(target)) {
      shelljs.rm(target); // remove previous build with same version
    }

    shelljs.cp(source, target);
    const err = shelljs.error();
    if (err) {
      console.log(chalk.red(err));
      console.log('\nFailed to copy generated apk');
      console.log(`source: ${source}\ntarget: ${target}\n`);
      return Promise.reject(null);
    }
    console.log(chalk.green('Done copying output.'));
  }
}

function isCrosswalkBuild() {
  if (
    fs.existsSync(path.join(root, 'plugins/cordova-plugin-crosswalk-webview'))
  ) {
    return true;
  }
  const pkgPath = path.join(root, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return (
    pkg.cordova &&
    pkg.cordova.plugins &&
    pkg.cordova.plugins['cordova-plugin-crosswalk-webview']
  );
}

function pad(segment: string, length: number = 2) {
  return padStart(segment, length, '0');
}
