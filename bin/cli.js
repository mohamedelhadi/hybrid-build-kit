#! /usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const path = require('path');
const shell = require('shelljs');
const pkg = require('../package.json');
const lib = require('../umd/hybrid-build-kit');
const environments = lib.environments;
const platforms = lib.platforms;
const initializer = lib.initializer;
const finalizer = lib.finalizer;

program
    .version(pkg.version);

program
    .command('initialize [env] [platform]')
    .description('Initializes the project with the specified env configurations')
    .action(function (env = environments.browser, platform = platforms.android) {
        console.log(chalk.cyan('\nInitializing..'));
        initializer.initialize(env, platform)
            .then(() => {
                console.log(chalk.yellow('Finished initialization.'));
            })
            .catch(err => {
                console.log(chalk.redBright('Initialization failed.'));
                process.exit(1);
            });
    });

program
    .command('finalize [env] [platform]')
    .description('Wraps up the build process')
    .option("-c, --copy-output", "Which setup mode to use")
    .action(function (env, platform = platforms.android, options) {
        if (!env) {
            console.log(chalk.red('env not specified'));
            console.log(chalk.redBright('Finalization failed.'));
            process.exit(1);
        }
        if (options.copyOutput) {
            console.log(chalk.cyan('\nFinalizing..'));
            finalizer.copyOutput(env, platform)
                .then(() => {
                    console.log(chalk.yellow('Finished finalization.'));
                })
                .catch(err => {
                    console.log(chalk.redBright('Finalization failed.'));
                    process.exit(1);
                });
        }
    });

program
    .command('setup')
    .description('Set up the project to support hybrid-build-kit commands')
    .action(function () {
        const source = path.join(__dirname.replace('bin', ''), 'setup');
        const destination = path.join(process.cwd(), 'src/_build');
        shell.cp('-R', source, destination);
        const err = shell.error();
        if (err) {
            console.log(chalk.red(err));
            console.log(chalk.redBright('Setup failed.'));
            process.exit(1);
        }
        console.log(chalk.yellow('Setup completed successfully.'));
    });

program.parse(process.argv);