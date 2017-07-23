#! /usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');
const lib = require('../umd/hybrid-build-kit');
const envs = lib.envs;
const platforms = lib.platforms;
const initializer = lib.initializer;

program
    .version(pkg.version);

program
    .command('initialize [env] [platform]')
    .description('initializes the project with the specified env configurations')
    .option('-p, --platform [platform]", "Platform to initialize against (android, ios, pwa)')
    .action(function (env = envs.browser, platform = platforms.android) {
        initializer.initialize(env, platform).then(() => {
            console.log(chalk.yellow(`Finished initialization.`));
        });
    });

program.parse(process.argv);