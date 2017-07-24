export { getVersionDetails };
declare function getVersionDetails(env: string): Promise<{
    segments: any;
    androidVersionCode: number;
    version: string;
}>;
