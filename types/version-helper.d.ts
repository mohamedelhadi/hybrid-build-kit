export { getVersionDetails };
declare function getVersionDetails(env: string): Promise<IVersionDetails>;
export interface IVersionDetails {
    segments: string[];
    androidVersionCode: number;
    version: string;
}
