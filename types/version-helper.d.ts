export { getVersionDetails, major, minor, patch, patchDigits, minorDigits };
declare const major = 0;
declare const minor = 1;
declare const patch = 2;
declare const patchDigits = 3;
declare const minorDigits = 2;
declare function getVersionDetails(env: string): Promise<IVersionDetails>;
export interface IVersionDetails {
    segments: string[];
    androidVersionCode: number;
    version: string;
}
