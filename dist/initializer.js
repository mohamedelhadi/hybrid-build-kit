import * as path from 'path';
import * as shelljs from 'shelljs';
import * as chalk from 'chalk';
export { initialize };
async function initialize(env, platform) {
    console.log(chalk.cyan('\nInitializing app..\n'));
    console.log('Targeted Environment: ', chalk.yellow(`${env}`));
    console.log('Targeted Platform: ', chalk.yellow(`${platform}`));
    const configPromise = copyConfiguration(env);
    return Promise.all([configPromise]);
}
function copyConfiguration(env) {
    return new Promise((resolve, reject) => {
        console.log(`Copying ${env} configurations...`);
        const appRoot = process.cwd();
        const src = path.join(appRoot, `src/_build/configs/${env}.config.ts`);
        const target = path.join(appRoot, 'src/app/env.config.ts');
        shelljs.cp(src, target);
        if (shelljs.error()) {
            console.log(chalk.red('\nCould not rename env config file!'));
            console.log(`source: ${src}\ntarget: ${target}\n`);
            reject();
            return;
        }
        console.log(chalk.green(`Done copying ${env} configurations`));
        resolve();
    });
}
//# sourceMappingURL=initializer.js.map