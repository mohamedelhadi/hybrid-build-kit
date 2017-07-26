const chalk = require('chalk');
const path = require('path');
const shell = require('shelljs');
const fs = require('fs');
const cheerio = require('cheerio');
var beautify_html = require('js-beautify').html;

module.exports = {
    run
}

function run() {
    const copyPromise = copyFiles();
    const indexPromise = prepareIndex();
    const settingsPromise = prepareSettings();
    return Promise.all([copyPromise, indexPromise, settingsPromise]);
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
        // strip bom (UTF-8 with BOM to just UTF-8)
        const content = fs.readFileSync(indexPath, 'utf8').replace(/^\uFEFF/, '');
        const $ = cheerio.load(content, {
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
        const html = beautify_html($.html());
        fs.writeFile(
            indexPath,
            html,
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

function prepareSettings() {
    return new Promise((resolve, reject) => {
        const configPath = path.join(process.cwd(), 'config.xml');
        const $ = cheerio.load(fs.readFileSync(configPath, 'utf8'), {
            xmlMode: true,
            decodeEntities: false
        });
        const settings = {
            app_name: $('name').text(),
            package_name: $('widget').attr('id')
        };
        fs.writeFile(
            path.join(process.cwd(), 'src/_build/settings.json'),
            JSON.stringify(settings, null, '\t'),
            err => {
                if (err) {
                    console.log(chalk.red(err));
                    console.log('Could not save app and package name to settings file\n');
                    reject(err);
                } else {
                    resolve();
                }
            });
    });
}