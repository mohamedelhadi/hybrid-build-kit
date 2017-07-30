export interface IConfiguration {
    mockApi?: boolean;
    environment: string;
}
export const environments = {
    browser: 'browser',
    dev: 'dev',
    testing: 'testing',
    staging: 'staging',
    production: 'production'
};
