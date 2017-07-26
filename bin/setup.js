const chalk = require('chalk');
const path = require('path');
const shell = require('shelljs');
const fs = require('fs');
const cheerio = require('cheerio');
const config = require('../config.json');

module.exports = {
    run
}

function run() {
    const copyPromise = copyFiles();
    const indexPromise = prepareIndex();
    const configPromise = prepareConfig();
    return Promise.all([copyPromise, indexPromise, configPromise]);
}

function copyFiles() {
    return new Promise((resolve, reject) => {
        const source = path.join(__dirname.replace('bin', ''), 'setup/*');
        const destination = path.join(process.cwd(), 'src');
        shell.cp('-R', source, destination);
        const err = shell.error();
        if (err) {
            console.log(chalk.red(err));
            console.log("Could not copy files to project\n");
            reject(err);
        } else {
            resolve();
        }
    });
}

function prepareIndex() {
    return new Promise((resolve, reject) => {
        const indexPath = path.join(process.cwd(), 'src/index.html');
        const $ = cheerio.load(fs.readFileSync(indexPath, 'utf8'), {
            // to avoid converting single quotes (in content security policy) to &apos;
            decodeEntities: false
        });
        const csp = $('meta[http-equiv="Content-Security-Policy"]');
        if (csp.length) {
            csp.attr('id', 'csp');
        } else {
            // if not already present then don't force it on the user
            // $('head').prepend('<meta id="csp" http-equiv="Content-Security-Policy" content="default-src *">');
        }
        const cordova = $('script[src="cordova.js"]');
        if (cordova.length) {
            cordova.attr('id', 'cordova-script');
        } else if ($('#cordova-script').length === 0) { // haven't been set up previously
            $('head').append('<script src="cordova.js" id="cordova-script"></script>');
        }
        if ($('#service-worker').length === 0) {
            $('<script src="" id="service-worker"></script>').insertAfter('#cordova-script');
        }
        fs.writeFile(
            indexPath,
            $.html(),
            err => {
                if (err) {
                    console.log(chalk.red(err));
                    console.log("Could not update index.html\n");
                    reject(err);
                } else {
                    resolve();
                }
            }
        );
    });
}

function prepareConfig() {
    return new Promise((resolve, reject) => {
        const configPath = path.join(process.cwd(), 'config.xml');
        const $ = cheerio.load(fs.readFileSync(configPath, 'utf8'), {
            xmlMode: true,
            decodeEntities: false
        });
        config.app_name = $('name').text();
        config.package_name = $('widget').attr('id');
        fs.writeFile(
            path.join(__dirname.replace('bin', ''), 'config.json'),
            JSON.stringify(config, null, '\t'),
            err => {
                if (err) {
                    console.log(chalk.red(err));
                    console.log('Could not save app and package name to config file\n');
                    reject(err);
                } else {
                    resolve();
                }
            });
    });
}