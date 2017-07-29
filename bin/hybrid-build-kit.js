#! /usr/bin/env node

const program = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');
const lib = require('../umd/hybrid-build-kit');
const environments = lib.environments;
const platforms = lib.platforms;
const initializer = lib.initializer;
const finalizer = lib.finalizer;
const setup = require('./setup');

program
    .usage('[command] [options]')
    .version(pkg.version);

program
    .command('initialize [env] [platform]')
    .description('Initializes the project with targeted env/platform')
    .action(initialize);

program
    .command('finalize [env] [platform]')
    .description('Wraps up the build process')
    .option("-c, --copy-output", "Copies build output to bin folder")
    .action(finalize);

program
    .command('setup')
    .description('Set up the project to support hybrid-build-kit commands')
    .action(setupProject);

program.parse(process.argv);

function initialize(env = environments.browser, platform = platforms.android) {
    console.log(chalk.cyan('\nInitializing..'));
    initializer.initialize(env, platform)
        .then(() => {
            console.log(chalk.yellow('Finished initialization.'));
        })
        .catch(err => {
            if (err) {
                console.log(err);
            }
            console.log(chalk.redBright('Initialization failed.'));
            process.exit(1);
        });
}

function finalize(env, platform = platforms.android, options) {
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
                if (err) {
                    console.log(err);
                }
                console.log(chalk.redBright('Finalization failed.'));
                process.exit(1);
            });
    }
}

function setupProject() {
    setup.run()
        .then(() => {
            console.log(chalk.yellow('Done setting up your project.'));
            initialize();
        })
        .catch(err => {
            if (err) {
                console.log(err);
            }
            console.log(chalk.redBright('Failed to set up the project.'));
            process.exit(1);
        });
}