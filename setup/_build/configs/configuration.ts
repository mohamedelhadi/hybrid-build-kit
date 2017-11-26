export interface IConfiguration {
    environment: string;
    version: string;
    baseUrl: string;
}
export const Environments = {
    browser: 'browser',
    dev: 'dev',
    testing: 'testing',
    staging: 'staging',
    production: 'production'
};
